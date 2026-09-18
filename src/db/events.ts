import { db, type EventRecord } from './schema';
export type { EventRecord };
import { generateUUID } from '../domain/ids';
import { formatDateBrussels } from '../domain/dates';
import { getAllowMultipleSessionsPerDay } from './meta';

/**
 * Crée un nouvel événement (séance d'entraînement ou course).
 * Si plusieurs séances du même type par jour ne sont pas autorisées,
 * réutilise la séance existante au lieu de créer un doublon.
 */
export async function createEvent(data: {
  date: string;
  type: 'presence' | 'course';
  title?: string;
  description?: string;
  id?: string;
}): Promise<EventRecord> {
  const normDate = formatDateBrussels(data.date);
  const allowMultiple = await getAllowMultipleSessionsPerDay();

  if (!allowMultiple) {
    const existingEvents = await getEventsByDateAndType(normDate, data.type);
    if (existingEvents.length > 0) {
      const existing = existingEvents[0];
      const customTitle = data.title && data.title.trim();
      const hasMeaningfulTitle = customTitle && customTitle !== 'Nouvelle entrée' && customTitle !== (data.type === 'course' ? 'Course' : 'Entraînement standard');
      const newTitle = hasMeaningfulTitle ? customTitle : existing.title;
      const newDesc = (data.description !== undefined && data.description.trim()) ? data.description.trim() : existing.description;

      const updated: EventRecord = {
        ...existing,
        title: newTitle,
        description: newDesc,
        updatedAt: Date.now(),
        dirty: 1,
      };
      await db.events.put(updated);
      return updated;
    }
  }

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

/**
 * Fusionne et nettoie les événements doublons ayant la même date et le même type
 * si l'option de sessions multiples est désactivée.
 */
export async function deduplicateEvents(): Promise<number> {
  const allowMultiple = await getAllowMultipleSessionsPerDay();
  if (allowMultiple) return 0;

  const all = await db.events.toArray();
  const groups = new Map<string, EventRecord[]>();

  for (const ev of all) {
    const normDate = formatDateBrussels(ev.date);
    const key = `${normDate}_${ev.type}`;
    const list = groups.get(key) || [];
    list.push(ev);
    groups.set(key, list);
  }

  let deletedCount = 0;

  for (const [, events] of groups) {
    if (events.length <= 1) continue;

    // Trier pour garder le plus pertinent (titre personnalisé ou mise à jour la plus récente)
    events.sort((a, b) => {
      const aHasCustomTitle = a.title && a.title !== 'Entraînement standard' && a.title !== 'Course' && a.title !== 'Nouvelle entrée';
      const bHasCustomTitle = b.title && b.title !== 'Entraînement standard' && b.title !== 'Course' && b.title !== 'Nouvelle entrée';
      if (aHasCustomTitle && !bHasCustomTitle) return -1;
      if (!aHasCustomTitle && bHasCustomTitle) return 1;
      return b.updatedAt - a.updatedAt;
    });

    const primary = events[0];
    const duplicates = events.slice(1);

    await db.transaction('rw', [db.events, db.attendances], async () => {
      for (const dup of duplicates) {
        // Réaffecter les pointages du doublon vers l'événement principal
        const attendances = await db.attendances.where('eventId').equals(dup.id).toArray();
        for (const att of attendances) {
          const newId = `${primary.id}_${att.studentId}`;
          const existingInPrimary = await db.attendances.get(newId);
          if (!existingInPrimary) {
            await db.attendances.put({
              ...att,
              id: newId,
              eventId: primary.id,
              date: primary.date,
              type: primary.type,
              dirty: 1,
            });
          }
          await db.attendances.delete(att.id);
        }
        await db.events.delete(dup.id);
        deletedCount++;
      }
    });
  }

  return deletedCount;
}

