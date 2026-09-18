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
  internals: number;
  byYear: Record<string, { girls: number; boys: number; internals: number; total: number }>;
}

export interface StudentInfo {
  id: string;
  gender: 'F' | 'M';
  year: string;
  active: boolean;
  isInternal?: boolean;
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
 * Extrait le niveau d'année d'une chaîne de classe/année (ex: "1A" -> "1", "2B" -> "2", "3" -> "3", "6e" -> "6").
 */
export function extractYearLevel(yearOrClass: string): string {
  if (!yearOrClass) return '';
  const trimmed = yearOrClass.trim();
  const match = trimmed.match(/^(\d+)/);
  if (match) {
    return match[1];
  }
  return trimmed;
}

/**
 * Calcule le résumé du jour pour un type de présence donné et une liste d'élèves.
 * Garantit qu'un élève n'est compté qu'une seule fois par séance.
 * Regroupe les statistiques par année d'étude (1, 2, 3, 4, 5, 6...).
 */
export function calculateDaySummary(
  attendances: AttendanceRecord[],
  studentsMap: Map<string, StudentInfo>,
  targetType?: 'presence' | 'course'
): DaySummary {
  let total = 0;
  let girls = 0;
  let boys = 0;
  let internals = 0;
  const byYear: Record<string, { girls: number; boys: number; internals: number; total: number }> = {};
  const seenStudentIds = new Set<string>();

  for (const att of attendances) {
    if (!att.present) continue;
    if (targetType && att.type !== targetType) continue;
    if (seenStudentIds.has(att.studentId)) continue;
    seenStudentIds.add(att.studentId);

    const student = studentsMap.get(att.studentId);
    if (!student) continue;

    total++;
    if (student.gender === 'F') {
      girls++;
    } else if (student.gender === 'M') {
      boys++;
    }

    if (student.isInternal) {
      internals++;
    }

    const rawYr = student.year || 'Non spécifiée';
    const yr = extractYearLevel(rawYr) || rawYr;
    if (!byYear[yr]) {
      byYear[yr] = { girls: 0, boys: 0, internals: 0, total: 0 };
    }
    byYear[yr].total++;
    if (student.gender === 'F') {
      byYear[yr].girls++;
    } else if (student.gender === 'M') {
      byYear[yr].boys++;
    }
    if (student.isInternal) {
      byYear[yr].internals++;
    }
  }

  return { total, girls, boys, internals, byYear };
}

/**
 * Calcule la synthèse de chaque élève (nombre de présences, courses, total et dernière date).
 * Garantit qu'un pointage n'est comptabilisé qu'une fois par (élève, date, type).
 */
export function calculateAllStudentStats(
  attendances: AttendanceRecord[]
): Map<string, StudentStats> {
  const statsMap = new Map<string, StudentStats>();
  const seenRecords = new Set<string>();

  for (const att of attendances) {
    if (!att.present) continue;
    const uniqueKey = `${att.studentId}_${att.date}_${att.type}`;
    if (seenRecords.has(uniqueKey)) continue;
    seenRecords.add(uniqueKey);

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

