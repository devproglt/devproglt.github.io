export interface StudentStats {
  studentId: string;
  presences: number;
  courses: number;
  total: number;
  lastSeen: string | null; // YYYY-MM-DD
}

export interface DaySummary {
  total: number;
  girls: number;
  boys: number;
  byYear: Record<string, { girls: number; boys: number; total: number }>;
}

export interface StudentInfo {
  id: string;
  gender: 'F' | 'M';
  year: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'presence' | 'course';
  present: boolean;
  markedAt: number;
  deviceId?: string;
  updatedAt?: number;
  dirty?: 0 | 1;
}

/**
 * Calcule le résumé du jour pour un type de présence donné et une liste d'élèves.
 */
export function calculateDaySummary(
  attendances: AttendanceRecord[],
  studentsMap: Map<string, StudentInfo>,
  targetType?: 'presence' | 'course'
): DaySummary {
  let total = 0;
  let girls = 0;
  let boys = 0;
  const byYear: Record<string, { girls: number; boys: number; total: number }> = {};

  for (const att of attendances) {
    if (!att.present) continue;
    if (targetType && att.type !== targetType) continue;

    const student = studentsMap.get(att.studentId);
    if (!student) continue;

    total++;
    if (student.gender === 'F') {
      girls++;
    } else if (student.gender === 'M') {
      boys++;
    }

    const yr = student.year || 'Non spécifiée';
    if (!byYear[yr]) {
      byYear[yr] = { girls: 0, boys: 0, total: 0 };
    }
    byYear[yr].total++;
    if (student.gender === 'F') {
      byYear[yr].girls++;
    } else if (student.gender === 'M') {
      byYear[yr].boys++;
    }
  }

  return { total, girls, boys, byYear };
}

/**
 * Calcule la synthèse de chaque élève (nombre de présences, courses, total et dernière date).
 */
export function calculateAllStudentStats(
  attendances: AttendanceRecord[]
): Map<string, StudentStats> {
  const statsMap = new Map<string, StudentStats>();

  for (const att of attendances) {
    if (!att.present) continue;

    let stat = statsMap.get(att.studentId);
    if (!stat) {
      stat = {
        studentId: att.studentId,
        presences: 0,
        courses: 0,
        total: 0,
        lastSeen: null,
      };
      statsMap.set(att.studentId, stat);
    }

    if (att.type === 'presence') {
      stat.presences++;
    } else if (att.type === 'course') {
      stat.courses++;
    }
    stat.total++;

    if (!stat.lastSeen || att.date > stat.lastSeen) {
      stat.lastSeen = att.date;
    }
  }

  return statsMap;
}
