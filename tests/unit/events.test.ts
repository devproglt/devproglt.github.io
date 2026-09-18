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

  it('garantit l\'unicité stricte par (date, type) par défaut (réutilisation de la séance)', async () => {
    // Par défaut, allowMultipleSessionsPerDay est false
    const ev1 = await createEvent({
      date: '2026-09-18',
      type: 'presence',
      title: 'Séance 1',
    });

    const ev2 = await createEvent({
      date: '2026-09-18',
      type: 'presence',
      title: 'Séance Renommée',
    });

    expect(ev2.id).toBe(ev1.id);
    expect(ev2.title).toBe('Séance Renommée');

    const all = await getEventsByDate('2026-09-18');
    expect(all.length).toBe(1);

    // En revanche, un type différent (course) sur la même date est autorisé
    const courseEv = await createEvent({
      date: '2026-09-18',
      type: 'course',
      title: 'Course de l\'après-midi',
    });
    expect(courseEv.id).not.toBe(ev1.id);

    const allWithCourse = await getEventsByDate('2026-09-18');
    expect(allWithCourse.length).toBe(2);
  });

  it('autorise plusieurs séances du même type par jour quand l\'option est activée', async () => {
    const { setAllowMultipleSessionsPerDay } = await import('../../src/db/meta');
    await setAllowMultipleSessionsPerDay(true);

    const ev1 = await createEvent({
      date: '2026-09-19',
      type: 'presence',
      title: 'Matin',
    });

    const ev2 = await createEvent({
      date: '2026-09-19',
      type: 'presence',
      title: 'Après-midi',
    });

    expect(ev1.id).not.toBe(ev2.id);

    const all = await getEventsByDate('2026-09-19');
    expect(all.length).toBe(2);

    // Remettre l'option à false
    await setAllowMultipleSessionsPerDay(false);
  });

  it('fusionne les doublons existants et leurs pointages avec deduplicateEvents', async () => {
    const { deduplicateEvents } = await import('../../src/db/events');
    const { setAllowMultipleSessionsPerDay } = await import('../../src/db/meta');

    // Forcer l'insertion de 2 séances identiques en base
    await setAllowMultipleSessionsPerDay(true);
    const ev1 = await createEvent({ date: '2026-09-20', type: 'presence', title: 'Séance A' });
    const ev2 = await createEvent({ date: '2026-09-20', type: 'presence', title: 'Séance B' });

    // Pointer un élève sur chaque séance
    await toggleAttendance(ev1.id, 'eleve_1', '2026-09-20', 'presence', true);
    await toggleAttendance(ev2.id, 'eleve_2', '2026-09-20', 'presence', true);

    // Désactiver les séances multiples et lancer la déduplication
    await setAllowMultipleSessionsPerDay(false);
    const deletedCount = await deduplicateEvents();
    expect(deletedCount).toBe(1);

    const remainingEvents = await getEventsByDate('2026-09-20');
    expect(remainingEvents.length).toBe(1);

    const primaryEventId = remainingEvents[0].id;
    const attendances = await getAttendancesByEvent(primaryEventId);
    expect(attendances.length).toBe(2);
    expect(attendances.map((a) => a.studentId).sort()).toEqual(['eleve_1', 'eleve_2']);
  });
});

