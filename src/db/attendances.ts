import { db, type AttendanceRecord } from './schema';
import { buildAttendanceId } from '../domain/ids';
import { getDeviceId } from './meta';

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
  const id = buildAttendanceId(studentId, date, type);
  const existing = await db.attendances.get(id);
  const now = Date.now();
  const deviceId = await getDeviceId();

  const nextPresent = overridePresent !== undefined ? overridePresent : (existing ? !existing.present : true);

  const record: AttendanceRecord = {
    id,
    studentId,
    date,
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
  return await db.attendances.where('[date+type]').equals([date, type]).toArray();
}

/**
 * Récupère tous les pointages pour une date donnée (tous types).
 */
export async function getAttendancesByDate(date: string): Promise<AttendanceRecord[]> {
  return await db.attendances.where('date').equals(date).toArray();
}

/**
 * Récupère l'historique complet des pointages pour un élève donné.
 */
export async function getAttendancesByStudent(studentId: string): Promise<AttendanceRecord[]> {
  return await db.attendances.where('studentId').equals(studentId).toArray();
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
