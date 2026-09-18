import { formatReadableDate } from './dates';
import type { DaySummary } from './stats';

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
 * Tri des présences : par classe croissant (naturel numérique ex: 1A, 1B, 2A, 10A),
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
      const yearComp = (a.year || '').localeCompare(b.year || '', 'fr', { numeric: true });
      if (yearComp !== 0) return yearComp;
      const fnComp = (a.firstName || '').localeCompare(b.firstName || '', 'fr');
      if (fnComp !== 0) return fnComp;
      return (a.lastName || '').localeCompare(b.lastName || '', 'fr');
    });

    text += `\nListe des présences (${sortedStudents.length}) :\n`;
    for (const student of sortedStudents) {
      text += `- ${student.firstName} ${student.lastName} (${student.year})\n`;
    }
  }

  return text;
}
