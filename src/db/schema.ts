import Dexie, { type EntityTable } from 'dexie';

export interface StudentRecord {
  id: string; // UUID v4
  lastName: string;
  firstName: string;
  gender: 'F' | 'M';
  year: string;
  active: boolean; // faux = désactivé
  notes: string;
  createdAt: string; // ISO 8601
  updatedAt: number; // ms epoch
  dirty: 0 | 1; // 1 = modification non synchronisée
  searchKey: string; // prénom + nom normalisés
}

export interface AttendanceRecord {
  id: string; // {studentId}_{date}_{type}
  studentId: string;
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
  attendances!: EntityTable<AttendanceRecord, 'id'>;
  meta!: EntityTable<MetaRecord, 'key'>;
  importLog!: EntityTable<ImportLogRecord, 'id'>;

  constructor() {
    super('PresencesDB');
    this.version(1).stores({
      students: 'id, lastName, firstName, year, gender, active, dirty, searchKey',
      attendances: 'id, studentId, date, type, [date+type], [studentId+date], dirty',
      meta: 'key',
      importLog: 'id, date',
    });
  }
}

export const db = new PresencesDatabase();
