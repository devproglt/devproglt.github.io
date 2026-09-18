import Dexie, { type EntityTable } from 'dexie';

export interface StudentRecord {
  id: string; // UUID v4
  lastName: string;
  firstName: string;
  gender: 'F' | 'M';
  year: string;
  active: boolean; // faux = désactivé
  isInternal: boolean; // EstInterne
  notes: string;
  createdAt: string; // ISO 8601
  updatedAt: number; // ms epoch
  dirty: 0 | 1; // 1 = modification non synchronisée
  searchKey: string; // prénom + nom normalisés
}

export interface EventRecord {
  id: string; // UUID v4 ou clé canonique
  date: string; // YYYY-MM-DD Europe/Brussels
  type: 'presence' | 'course';
  title: string; // ex: "Cross de rentrée", "Entraînement Endurance"
  description?: string; // Notes / commentaires
  createdAt: string; // ISO 8601
  updatedAt: number; // ms epoch
  dirty: 0 | 1;
}

export interface AttendanceRecord {
  id: string; // {eventId}_{studentId}
  eventId: string; // Référence vers EventRecord.id
  studentId: string; // Référence vers StudentRecord.id
  date: string; // YYYY-MM-DD Europe/Brussels
  type: 'presence' | 'course';
  present: boolean;
  markedAt: number; // ms epoch
  deviceId: string;
  updatedAt: number; // ms epoch
  dirty: 0 | 1;
}

export interface MetaRecord {
  key: string;
  value: any;
}

export interface ImportLogRecord {
  id: string;
  date: string; // ISO 8601
  fileName: string;
  created: number;
  updated: number;
  skipped: number;
}

export class PresencesDatabase extends Dexie {
  students!: EntityTable<StudentRecord, 'id'>;
  events!: EntityTable<EventRecord, 'id'>;
  attendances!: EntityTable<AttendanceRecord, 'id'>;
  meta!: EntityTable<MetaRecord, 'key'>;
  importLog!: EntityTable<ImportLogRecord, 'id'>;

  constructor() {
    super('PresencesDB');
    this.version(1).stores({
      students: 'id, lastName, firstName, year, gender, active, isInternal, dirty, searchKey',
      attendances: 'id, studentId, date, type, [date+type], [studentId+date], dirty',
      meta: 'key',
      importLog: 'id, date',
    });

    this.version(2).stores({
      students: 'id, lastName, firstName, year, gender, active, isInternal, dirty, searchKey',
      events: 'id, date, type, [date+type], updatedAt, dirty',
      attendances: 'id, eventId, studentId, date, type, [eventId+studentId], [date+type], dirty',
      meta: 'key',
      importLog: 'id, date',
    }).upgrade(async (tx) => {
      // Migration automatique des présences existantes vers des événements par défaut
      const attendancesTable = tx.table('attendances');
      const eventsTable = tx.table('events');
      const allAtts = await attendancesTable.toArray();
      const eventMap = new Map<string, any>();

      for (const att of allAtts) {
        const date = att.date || '2026-09-18';
        const type = att.type === 'course' ? 'course' : 'presence';
        const eventId = att.eventId || `${date}_${type}`;
        
        if (!eventMap.has(eventId)) {
          eventMap.set(eventId, {
            id: eventId,
            date: date,
            type: type,
            title: type === 'course' ? 'Course' : 'Entraînement standard',
            description: '',
            createdAt: new Date().toISOString(),
            updatedAt: att.updatedAt || Date.now(),
            dirty: 0,
          });
        }

        att.eventId = eventId;
        att.id = `${eventId}_${att.studentId}`;
        await attendancesTable.put(att);
      }

      for (const ev of eventMap.values()) {
        await eventsTable.put(ev);
      }
    });
  }
}

export const db = new PresencesDatabase();
