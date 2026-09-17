import { db, type AttendanceRecord } from './schema';
export type { AttendanceRecord };
import { buildAttendanceId } from '../domain/ids';
import { getDeviceId } from './meta';
import { formatDateBrussels } from '../domain/dates';

/**
 * Bascule le statut de présence d'un élève pour une date et un type donnés.
 * Si l'enregistrement n'existe pas, il est créé avec present = true.
 * S'il existe, present est basculé (true <-> false).
 */
export async function toggleAttendance(
  studentId: string,
  date: string,
  type: 'presence' | 'course',
  overridePresent?: boolean
): Promise<AttendanceRecord> {
  const normDate = formatDateBrussels(date);
  const id = buildAttendanceId(studentId, normDate, type);
  const existing = await db.attendances.get(id);
  const now = Date.now();
  const deviceId = await getDeviceId();

  const nextPresent = overridePresent !== undefined ? overridePresent : (existing ? !existing.present : true);

  const record: AttendanceRecord = {
    id,
    studentId,
    date: normDate,
    type,
    present: nextPresent,
    markedAt: now,
    deviceId,
    updatedAt: now,
    dirty: 1,
  };

  await db.attendances.put(record);
  return record;
}

/**
 * Récupère tous les pointages pour une date et un type donnés.
 */
export async function getAttendancesByDateAndType(
  date: string,
  type: 'presence' | 'course'
): Promise<AttendanceRecord[]> {
  const normDate = formatDateBrussels(date);
  return await db.attendances.where('[date+type]').equals([normDate, type]).toArray();
}

/**
 * Récupère tous les pointages pour une date donnée (tous types).
 */
export async function getAttendancesByDate(date: string): Promise<AttendanceRecord[]> {
  const normDate = formatDateBrussels(date);
  return await db.attendances.where('date').equals(normDate).toArray();
}

/**
 * Récupère l'historique complet des pointages pour un élève donné.
 */
export async function getAttendancesByStudent(studentId: string): Promise<AttendanceRecord[]> {
  return await db.attendances.where('studentId').equals(studentId).toArray();
}

/**
 * Nettoie, dédoublonne et normalise tous les enregistrements de pointages en base locale :
 * - Garantit strictement 1 pointage max par élève / date / type
 * - Corrige les dates au format standard YYYY-MM-DD
 * - Harmonise les identifiants composites id = studentId_date_type
 */
export async function normalizeAndRepairAttendances(): Promise<number> {
  const allAttendances = await db.attendances.toArray();
  let repairedCount = 0;
  const uniqueKeyMap = new Map<string, AttendanceRecord>();

  await db.transaction('rw', db.attendances, async () => {
    for (const att of allAttendances) {
      const cleanDate = formatDateBrussels(att.date);
      const cleanType: 'presence' | 'course' = att.type === 'course' ? 'course' : 'presence';
      const studentId = att.studentId;

      const uniqueKey = `${studentId}_${cleanDate}_${cleanType}`;
      const existing = uniqueKeyMap.get(uniqueKey);

      if (!existing || (att.updatedAt || 0) > (existing.updatedAt || 0) || (att.markedAt || 0) > (existing.markedAt || 0)) {
        if (existing && existing.id !== att.id) {
          await db.attendances.delete(existing.id);
          repairedCount++;
        }
        uniqueKeyMap.set(uniqueKey, {
          ...att,
          id: uniqueKey,
          date: cleanDate,
          type: cleanType,
          present: Boolean(att.present),
        });
      } else {
        await db.attendances.delete(att.id);
        repairedCount++;
      }
    }

    for (const att of uniqueKeyMap.values()) {
      await db.attendances.put(att);
    }
  });

  return repairedCount;
}

/**
 * Récupère l'ensemble des pointages enregistrés en base.
 */
export async function getAllAttendances(): Promise<AttendanceRecord[]> {
  return await db.attendances.toArray();
}

/**
 * Récupère les pointages non synchronisés (dirty == 1).
 */
export async function getDirtyAttendances(): Promise<AttendanceRecord[]> {
  return await db.attendances.where('dirty').equals(1).toArray();
}

/**
 * Marque les pointages spécifiés comme synchronisés (dirty = 0).
 */
export async function markAttendancesSynced(ids: string[]): Promise<void> {
  await db.transaction('rw', db.attendances, async () => {
    for (const id of ids) {
      await db.attendances.update(id, { dirty: 0 });
    }
  });
}

/**
 * Supprime l'ensemble des pointages (remise à zéro des présences).
 */
export async function clearAllAttendances(): Promise<void> {
  await db.attendances.clear();
}
