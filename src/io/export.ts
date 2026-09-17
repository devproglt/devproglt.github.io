import { getXLSXModule } from './import';
import type { StudentRecord, AttendanceRecord } from '../db/schema';
import type { StudentStats } from '../domain/stats';
import { getTodayBrussels, formatTimeBrussels } from '../domain/dates';

export async function exportCurrentViewToExcel(
  students: StudentRecord[],
  attendances: AttendanceRecord[],
  statsMap: Map<string, StudentStats>
): Promise<void> {
  const XLSX = await getXLSXModule();
  const today = getTodayBrussels();

  const studentsMap = new Map<string, StudentRecord>(students.map((s) => [s.id, s]));

  // Feuille 1: Élèves
  const elevesSheetData = students.map((s) => ({
    ID: s.id,
    Nom: s.lastName,
    Prénom: s.firstName,
    Sexe: s.gender,
    Année: s.year,
    Actif: s.active ? 'Oui' : 'Non',
    Notes: s.notes,
    'Date Création': s.createdAt,
  }));

  // Feuille 2: Présences effectives (present == true)
  const presentAttendances = attendances.filter((a) => a.present);
  presentAttendances.sort((a, b) => b.markedAt - a.markedAt);

  const presencesSheetData = presentAttendances.map((att) => {
    const student = studentsMap.get(att.studentId);
    return {
      Date: att.date,
      Type: att.type === 'presence' ? 'Présence' : 'Course',
      Nom: student ? student.lastName : 'Inconnu',
      Prénom: student ? student.firstName : 'Inconnu',
      Année: student ? student.year : '',
      Sexe: student ? student.gender : '',
      Heure: formatTimeBrussels(att.markedAt),
      Appareil: att.deviceId,
    };
  });

  // Feuille 3: Synthèse par élève
  const syntheseSheetData = students.map((s) => {
    const stat = statsMap.get(s.id) || { presences: 0, courses: 0, total: 0, lastSeen: null, studentId: s.id };
    return {
      Nom: s.lastName,
      Prénom: s.firstName,
      Année: s.year,
      Sexe: s.gender,
      Actif: s.active ? 'Oui' : 'Non',
      Présences: stat.presences,
      Courses: stat.courses,
      Total: stat.total,
      'Dernière venue': stat.lastSeen || 'Aucune',
    };
  });

  const workbook = XLSX.utils.book_new();

  const wsEleves = XLSX.utils.json_to_sheet(elevesSheetData);
  const wsPresences = XLSX.utils.json_to_sheet(presencesSheetData);
  const wsSynthese = XLSX.utils.json_to_sheet(syntheseSheetData);

  XLSX.utils.book_append_sheet(workbook, wsEleves, 'Élèves');
  XLSX.utils.book_append_sheet(workbook, wsPresences, 'Présences');
  XLSX.utils.book_append_sheet(workbook, wsSynthese, 'Synthèse');

  XLSX.writeFile(workbook, `presences_${today}.xlsx`);
}
