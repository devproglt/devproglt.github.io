import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../src/db/schema';
import { createEvent, getEventById, getEventsByDate, updateEvent, deleteEvent } from '../../src/db/events';
import { toggleAttendance, getAttendancesByEvent } from '../../src/db/attendances';

describe('DB: Events & Event-bounded Attendances', () => {
  beforeEach(async () => {
    await db.events.clear();
    await db.attendances.clear();
  });

  it('crée un événement avec un titre personnalisé ou un titre par défaut', async () => {
    const customEvent = await createEvent({
      date: '2026-09-18',
      type: 'course',
      title: 'Cross de rentrée',
    });
    expect(customEvent.id).toBeDefined();
    expect(customEvent.title).toBe('Cross de rentrée');
    expect(customEvent.type).toBe('course');

    const defaultEvent = await createEvent({
      date: '2026-09-18',
      type: 'presence',
    });
    expect(defaultEvent.title).toBe('Entraînement standard');
    expect(defaultEvent.type).toBe('presence');
  });

  it('récupère les événements par date et par ID', async () => {
    const ev = await createEvent({
      date: '2026-09-18',
      type: 'presence',
      title: 'Demi-fond',
    });

    const byDate = await getEventsByDate('2026-09-18');
    expect(byDate.length).toBe(1);
    expect(byDate[0].title).toBe('Demi-fond');

    const byId = await getEventById(ev.id);
    expect(byId).toBeDefined();
    expect(byId?.title).toBe('Demi-fond');
  });

  it('enregistre des pointages strictement liés à l\'événement sans doublon', async () => {
    const ev1 = await createEvent({ date: '2026-09-18', type: 'presence', title: 'Séance 1' });
    const ev2 = await createEvent({ date: '2026-09-18', type: 'course', title: 'Course 1' });

    // Pointer l'élève s1 sur ev1
    const att1 = await toggleAttendance(ev1.id, 's1', '2026-09-18', 'presence', true);
    expect(att1.id).toBe(`${ev1.id}_s1`);
    expect(att1.present).toBe(true);

    // Pointer le même élève s1 sur ev2
    const att2 = await toggleAttendance(ev2.id, 's1', '2026-09-18', 'course', true);
    expect(att2.id).toBe(`${ev2.id}_s1`);
    expect(att2.present).toBe(true);

    // Vérifier les listes par événement
    const listEv1 = await getAttendancesByEvent(ev1.id);
    const listEv2 = await getAttendancesByEvent(ev2.id);

    expect(listEv1.length).toBe(1);
    expect(listEv1[0].id).toBe(`${ev1.id}_s1`);

    expect(listEv2.length).toBe(1);
    expect(listEv2[0].id).toBe(`${ev2.id}_s1`);

    // Toggle off sur ev1
    const attToggle = await toggleAttendance(ev1.id, 's1', '2026-09-18', 'presence');
    expect(attToggle.present).toBe(false);

    const listEv1After = await getAttendancesByEvent(ev1.id);
    expect(listEv1After[0].present).toBe(false);
  });

  it('met à jour et supprime un événement', async () => {
    const ev = await createEvent({
      date: '2026-09-18',
      type: 'presence',
      title: 'Séance Initiale',
    });

    await updateEvent(ev.id, {
      title: 'Séance Modifiée',
    });

    const updated = await getEventById(ev.id);
    expect(updated?.title).toBe('Séance Modifiée');

    await deleteEvent(ev.id);
    const deleted = await getEventById(ev.id);
    expect(deleted).toBeUndefined();
  });
});
