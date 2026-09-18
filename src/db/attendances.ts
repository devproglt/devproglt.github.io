import { db, type AttendanceRecord } from './schema';
export type { AttendanceRecord };
import { getDeviceId } from './meta';
import { formatDateBrussels } from '../domain/dates';
import { getOrCreateDefaultEvent } from './events';

/**
 * Bascule le statut de présence d'un élève pour un événement donné.
 * Si l'enregistrement n'existe pas, il est créé avec present = true.
 * S'il existe, present est basculé (true <-> false).
 */
export async function toggleAttendance(
  eventId: string,
  studentId: string,
  date: string,
  type: 'presence' | 'course',
  overridePresent?: boolean
): Promise<AttendanceRecord> {
  const normDate = formatDateBrussels(date);
  const id = `${eventId}_${studentId}`;
  const existing = await db.attendances.get(id);
  const now = Date.now();
  const deviceId = await getDeviceId();

  const nextPresent = overridePresent !== undefined ? overridePresent : (existing ? !existing.present : true);

  const record: AttendanceRecord = {
    id,
    eventId,
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
 * Récupère tous les pointages pour un événement donné.
 */
export async function getAttendancesByEvent(eventId: string): Promise<AttendanceRecord[]> {
  return await db.attendances.where('eventId').equals(eventId).toArray();
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
 * - Garantit strictement 1 pointage max par élève et par événement
 * - Rallie les anciens pointages sans eventId à un événement par défaut
 * - Purge tout résidu, orphelin ou ancien format
 */
export async function normalizeAndRepairAttendances(): Promise<number> {
  const allAttendances = await db.attendances.toArray();
  const allStudents = await db.students.toArray();
  const validStudentMap = new Map(allStudents.map((s) => [s.id, s]));

  const uniqueKeyMap = new Map<string, AttendanceRecord>();
  let duplicateCount = 0;

  for (const att of allAttendances) {
    const studentId = att.studentId;
    
    // Si l'élève n'existe plus en base, l'ignorer
    if (!validStudentMap.has(studentId)) {
      duplicateCount++;
      continue;
    }

    const cleanDate = formatDateBrussels(att.date);
    if (!cleanDate) {
      duplicateCount++;
      continue;
    }

    const cleanType: 'presence' | 'course' = String(att.type).toLowerCase() === 'course' ? 'course' : 'presence';
    let eventId = att.eventId;

    // Si pas d'eventId, rattacher à l'événement par défaut pour (date, type)
    if (!eventId) {
      const defaultEvent = await getOrCreateDefaultEvent(cleanDate, cleanType);
      eventId = defaultEvent.id;
    }

    const canonicalKey = `${eventId}_${studentId}`;
    const existing = uniqueKeyMap.get(canonicalKey);

    if (!existing) {
      uniqueKeyMap.set(canonicalKey, {
        ...att,
        id: canonicalKey,
        eventId,
        studentId,
        date: cleanDate,
        type: cleanType,
        present: Boolean(att.present),
        dirty: att.dirty !== undefined ? att.dirty : 0,
      });
    } else {
      duplicateCount++;
      const isAttNewer = (att.updatedAt || 0) > (existing.updatedAt || 0);
      const keepPresent = isAttNewer ? Boolean(att.present) : (existing.present || Boolean(att.present));
      const latestUpdatedAt = Math.max(att.updatedAt || 0, existing.updatedAt || 0);
      const latestMarkedAt = Math.max(att.markedAt || 0, existing.markedAt || 0);
      const dirty = (att.dirty || existing.dirty) ? 1 : 0;

      uniqueKeyMap.set(canonicalKey, {
        ...existing,
        id: canonicalKey,
        eventId,
        present: keepPresent,
        updatedAt: latestUpdatedAt,
        markedAt: latestMarkedAt,
        deviceId: (isAttNewer ? att.deviceId : existing.deviceId) || existing.deviceId || '',
        dirty,
      });
    }
  }

  // Remplacement atomique de la table attendances par la version purgée et dédoublonnée
  await db.transaction('rw', db.attendances, async () => {
    await db.attendances.clear();
    await db.attendances.bulkPut(Array.from(uniqueKeyMap.values()));
  });

  return duplicateCount;
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

