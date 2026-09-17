import { getMeta, setMeta, getDeviceId } from '../db/meta';
import { getDirtyStudents, markStudentsSynced, deduplicateStudents } from '../db/students';
import { getDirtyAttendances, markAttendancesSynced, normalizeAndRepairAttendances } from '../db/attendances';
import { formatDateBrussels } from '../domain/dates';
import { db } from '../db/schema';
import { pushToServer, pullFromServer } from './client';

export type SyncStatus = 'synced' | 'pending' | 'offline';

export interface SyncEngineListener {
  (status: SyncStatus, pendingCount: number): void;
}

export class SyncEngine {
  private static instance: SyncEngine;
  private isSyncing = false;
  private debounceTimer: any = null;
  private listeners: Set<SyncEngineListener> = new Set();
  private retryDelayMs = 30000; // 30s
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.triggerSync('online_event');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.triggerSync('visibility_change');
        }
      });
    }
  }

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  public subscribe(listener: SyncEngineListener): () => void {
    this.listeners.add(listener);
    this.notifyListeners();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public scheduleDebouncedSync(delayMs = 10000): void {
    this.notifyListeners();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.triggerSync('debounced_auto');
    }, delayMs);
  }

  public async getPendingCount(): Promise<number> {
    const dirtyS = await getDirtyStudents();
    const dirtyA = await getDirtyAttendances();
    return dirtyS.length + dirtyA.length;
  }

  public async notifyListeners(): Promise<void> {
    const pendingCount = await this.getPendingCount();
    let status: SyncStatus = 'synced';
    if (!this.isOnline) {
      status = 'offline';
    } else if (pendingCount > 0) {
      status = 'pending';
    }

    for (const listener of this.listeners) {
      listener(status, pendingCount);
    }
  }

  public async triggerSync(source = 'manual', options: { forceFull?: boolean } = {}): Promise<{ success: boolean; message?: string; pulledCount?: number }> {
    if (this.isSyncing) {
      return { success: false, message: 'Synchronisation déjà en cours.' };
    }

    if (!this.isOnline) {
      this.notifyListeners();
      return { success: false, message: 'Appareil hors ligne.' };
    }

    const syncUrl = await getMeta<string>('syncUrl', '');
    const syncToken = await getMeta<string>('syncToken', '');

    if (!syncUrl || !syncToken) {
      this.notifyListeners();
      return { success: false, message: 'URL ou jeton de synchronisation non configuré.' };
    }

    this.isSyncing = true;
    let totalPulled = 0;
    try {
      const deviceId = await getDeviceId();

      // 1. PUSH
      const dirtyStudents = await getDirtyStudents();
      const dirtyAttendances = await getDirtyAttendances();

      if (dirtyStudents.length > 0 || dirtyAttendances.length > 0) {
        // Envoi par lots de 500 max
        const batchStudents = dirtyStudents.slice(0, 500);
        const batchAttendances = dirtyAttendances.slice(0, 500);

        const pushRes = await pushToServer(syncUrl, syncToken, deviceId, batchStudents, batchAttendances);

        if (pushRes.accepted) {
          const acceptedIds = new Set(pushRes.accepted);
          const acceptedStudents = batchStudents.filter((s) => acceptedIds.has(s.id)).map((s) => s.id);
          const acceptedAttendances = batchAttendances.filter((a) => acceptedIds.has(a.id)).map((a) => a.id);

          await markStudentsSynced(acceptedStudents);
          await markAttendancesSynced(acceptedAttendances);
        }

        if (pushRes.rejected) {
          // Les lignes rejetées repassent dirty = 0 et seront écrasées au pull
          const rejectedIds = new Set(pushRes.rejected);
          const rejectedStudents = batchStudents.filter((s) => rejectedIds.has(s.id)).map((s) => s.id);
          const rejectedAttendances = batchAttendances.filter((a) => rejectedIds.has(a.id)).map((a) => a.id);

          await markStudentsSynced(rejectedStudents);
          await markAttendancesSynced(rejectedAttendances);
        }
      }

      // 2. PULL
      const cursor = options.forceFull ? 0 : await getMeta<number>('lastPullCursor', 0);
      const pullRes = await pullFromServer(syncUrl, syncToken, cursor);

      if (pullRes.students || pullRes.attendances) {
        await db.transaction('rw', [db.students, db.attendances, db.meta], async () => {
          // Fusion des élèves
          if (pullRes.students) {
            totalPulled += pullRes.students.length;
            const existingAll = await db.students.toArray();
            const existingByName = new Map<string, typeof existingAll[0]>();
            for (const ex of existingAll) {
              const k = `${ex.firstName.trim().toLowerCase()}_${ex.lastName.trim().toLowerCase()}_${(ex.year || '').trim().toLowerCase()}`;
              existingByName.set(k, ex);
            }

            for (const incomingS of pullRes.students) {
              const local = await db.students.get(incomingS.id);
              const nameKey = `${incomingS.firstName.trim().toLowerCase()}_${incomingS.lastName.trim().toLowerCase()}_${(incomingS.year || '').trim().toLowerCase()}`;
              const matchByName = existingByName.get(nameKey);

              const searchKey = `${incomingS.firstName} ${incomingS.lastName}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

              if (local) {
                if (incomingS.updatedAt >= local.updatedAt || options.forceFull) {
                  await db.students.put({
                    ...incomingS,
                    active: incomingS.active !== undefined ? incomingS.active : true,
                    isInternal: incomingS.isInternal || false,
                    searchKey,
                    dirty: 0,
                  });
                }
              } else if (matchByName && matchByName.id !== incomingS.id) {
                // Même nom mais ID différent (doublon) : fusionner vers l'ID du serveur
                const oldId = matchByName.id;
                const oldAttendances = await db.attendances.where('studentId').equals(oldId).toArray();
                for (const att of oldAttendances) {
                  const cleanDate = formatDateBrussels(att.date);
                  const cleanType = att.type === 'course' ? 'course' : 'presence';
                  const newAttId = `${incomingS.id}_${cleanDate}_${cleanType}`;
                  const existingAtt = await db.attendances.get(newAttId);
                  if (!existingAtt) {
                    await db.attendances.put({
                      ...att,
                      id: newAttId,
                      studentId: incomingS.id,
                      date: cleanDate,
                      type: cleanType,
                    });
                  }
                  await db.attendances.delete(att.id);
                }
                await db.students.delete(oldId);

                await db.students.put({
                  ...incomingS,
                  active: incomingS.active !== undefined ? incomingS.active : true,
                  isInternal: incomingS.isInternal || false,
                  searchKey,
                  dirty: 0,
                });
                existingByName.set(nameKey, incomingS as any);
              } else {
                await db.students.put({
                  ...incomingS,
                  active: incomingS.active !== undefined ? incomingS.active : true,
                  isInternal: incomingS.isInternal || false,
                  searchKey,
                  dirty: 0,
                });
                existingByName.set(nameKey, incomingS as any);
              }
            }
          }

          // Fusion des pointages
          if (pullRes.attendances) {
            totalPulled += pullRes.attendances.length;
            for (const incomingA of pullRes.attendances) {
              const cleanDate = formatDateBrussels(incomingA.date);
              const cleanType: 'presence' | 'course' = incomingA.type === 'course' ? 'course' : 'presence';
              const canonicalId = `${incomingA.studentId}_${cleanDate}_${cleanType}`;
              const local = await db.attendances.get(canonicalId);
              if (!local || incomingA.updatedAt >= local.updatedAt || options.forceFull) {
                await db.attendances.put({
                  ...incomingA,
                  id: canonicalId,
                  date: cleanDate,
                  type: cleanType,
                  present: Boolean(incomingA.present),
                  dirty: 0,
                });
              }
            }
          }

          if (pullRes.cursor !== undefined) {
            await setMeta('lastPullCursor', pullRes.cursor);
          }
          await setMeta('lastSyncAt', Date.now());
        });

        // Déduplication et normalisation de sécurité finale
        await deduplicateStudents();
        await normalizeAndRepairAttendances();
      }

      this.retryDelayMs = 30000; // Reset backoff
      await this.notifyListeners();
      return { success: true, pulledCount: totalPulled };
    } catch (err: any) {
      console.error(`[Sync Engine Error (${source})]:`, err);
      // Backoff exponentiel (30s -> 2m -> 10m)
      if (this.retryDelayMs < 600000) {
        this.retryDelayMs *= 4;
      }
      this.notifyListeners();
      return { success: false, message: err?.message || 'Erreur inconnue lors de la synchronisation.' };
    } finally {
      this.isSyncing = false;
    }
  }
}
