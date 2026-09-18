import { formatReadableDate } from './dates';
import { extractYearLevel, type DaySummary } from './stats';

export interface AttendanceSummaryStudent {
  firstName: string;
  lastName: string;
  year: string;
}

export interface SummaryOptions {
  title: string;
  description?: string;
  date: string;
  summary: DaySummary;
  students: AttendanceSummaryStudent[];
}

/**
 * Génère le texte récapitulatif formaté de la séance pour le presse-papier.
 * Tri des présences : par année croissante (1, 2, 3, 4, 5, 6),
 * puis par prénom, puis par nom.
 */
export function generateAttendanceSummaryText(options: SummaryOptions): string {
  const { title, description, date, summary, students } = options;
  const readableDate = formatReadableDate(date);

  let text = `Résumé : ${title} — ${readableDate}\n`;
  if (description && description.trim()) {
    text += `Remarques : ${description.trim()}\n`;
  }
  text += `Total: ${summary.total} élève(s) (Filles: ${summary.girls}, Garçons: ${summary.boys}, Internes: ${summary.internals})\n\n`;

  text += `Répartition par année:\n`;
  const sortedYears = Object.entries(summary.byYear).sort(([a], [b]) =>
    a.localeCompare(b, 'fr', { numeric: true })
  );

  for (const [yr, counts] of sortedYears) {
    text += `- ${yr}: ${counts.total} (F: ${counts.girls}, G: ${counts.boys}, I: ${counts.internals})\n`;
  }

  if (students.length > 0) {
    const sortedStudents = [...students].sort((a, b) => {
      const aYr = extractYearLevel(a.year || '');
      const bYr = extractYearLevel(b.year || '');
      const yearComp = aYr.localeCompare(bYr, 'fr', { numeric: true });
      if (yearComp !== 0) return yearComp;
      const fnComp = (a.firstName || '').localeCompare(b.firstName || '', 'fr');
      if (fnComp !== 0) return fnComp;
      return (a.lastName || '').localeCompare(b.lastName || '', 'fr');
    });

    text += `\nListe des présences (${sortedStudents.length}) :\n`;
    for (const student of sortedStudents) {
      const yr = extractYearLevel(student.year || '');
      text += `- ${student.firstName} ${student.lastName}${yr ? ` (${yr})` : ''}\n`;
    }
  }

  return text;
}
