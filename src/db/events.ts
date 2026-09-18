import { db, type EventRecord } from './schema';
export type { EventRecord };
import { generateUUID } from '../domain/ids';
import { formatDateBrussels } from '../domain/dates';

/**
 * Crée un nouvel événement (séance d'entraînement ou course).
 */
export async function createEvent(data: {
  date: string;
  type: 'presence' | 'course';
  title?: string;
  description?: string;
  id?: string;
}): Promise<EventRecord> {
  const normDate = formatDateBrussels(data.date);
  const now = Date.now();
  const id = data.id || generateUUID();
  const defaultTitle = data.type === 'course' ? 'Course' : 'Entraînement standard';
  const title = (data.title && data.title.trim()) ? data.title.trim() : defaultTitle;

  const event: EventRecord = {
    id,
    date: normDate,
    type: data.type,
    title,
    description: data.description ? data.description.trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: now,
    dirty: 1,
  };

  await db.events.put(event);
  return event;
}

/**
 * Met à jour les informations d'un événement existant.
 */
export async function updateEvent(
  id: string,
  updates: Partial<Omit<EventRecord, 'id' | 'createdAt'>>
): Promise<EventRecord | undefined> {
  const existing = await db.events.get(id);
  if (!existing) return undefined;

  const updated: EventRecord = {
    ...existing,
    ...updates,
    date: updates.date ? formatDateBrussels(updates.date) : existing.date,
    updatedAt: Date.now(),
    dirty: 1,
  };

  await db.events.put(updated);
  return updated;
}

/**
 * Récupère un événement par son ID.
 */
export async function getEventById(id: string): Promise<EventRecord | undefined> {
  return await db.events.get(id);
}

/**
 * Récupère tous les événements pour une date donnée.
 */
export async function getEventsByDate(date: string): Promise<EventRecord[]> {
  const normDate = formatDateBrussels(date);
  return await db.events.where('date').equals(normDate).toArray();
}

/**
 * Récupère tous les événements pour une date et un type donnés.
 */
export async function getEventsByDateAndType(
  date: string,
  type: 'presence' | 'course'
): Promise<EventRecord[]> {
  const normDate = formatDateBrussels(date);
  return await db.events.where('[date+type]').equals([normDate, type]).toArray();
}

/**
 * Récupère ou crée automatiquement un événement par défaut pour une date et un type donnés.
 */
export async function getOrCreateDefaultEvent(
  date: string,
  type: 'presence' | 'course',
  title?: string
): Promise<EventRecord> {
  const normDate = formatDateBrussels(date);
  const existingEvents = await getEventsByDateAndType(normDate, type);
  if (existingEvents.length > 0) {
    return existingEvents[0];
  }
  return await createEvent({
    date: normDate,
    type,
    title: title || (type === 'course' ? 'Course' : 'Entraînement standard'),
  });
}

/**
 * Récupère la totalité des événements ordonnés par date décroissante.
 */
export async function getAllEvents(): Promise<EventRecord[]> {
  const events = await db.events.toArray();
  return events.sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);
}

/**
 * Supprime un événement et tous ses pointages associés.
 */
export async function deleteEvent(id: string): Promise<void> {
  await db.transaction('rw', [db.events, db.attendances], async () => {
    await db.attendances.where('eventId').equals(id).delete();
    await db.events.delete(id);
  });
}

/**
 * Récupère les événements non synchronisés (dirty == 1).
 */
export async function getDirtyEvents(): Promise<EventRecord[]> {
  return await db.events.where('dirty').equals(1).toArray();
}

/**
 * Marque les événements comme synchronisés (dirty = 0).
 */
export async function markEventsSynced(ids: string[]): Promise<void> {
  await db.transaction('rw', db.events, async () => {
    for (const id of ids) {
      await db.events.update(id, { dirty: 0 });
    }
  });
}

/**
 * Supprime tous les événements (remise à zéro).
 */
export async function clearAllEvents(): Promise<void> {
  await db.events.clear();
}
