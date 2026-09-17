/**
 * Utilitaires pour le traitement des dates dans le fuseau horaire Europe/Brussels.
 */

const TIMEZONE = 'Europe/Brussels';

/**
 * Retourne la date courante au format YYYY-MM-DD dans le fuseau horaire Europe/Brussels.
 */
export function getTodayBrussels(): string {
  return formatDateBrussels(new Date());
}

/**
 * Formate un objet Date ou timestamp au format YYYY-MM-DD (Europe/Brussels).
 */
export function formatDateBrussels(dateInput: Date | number | string): string {
  const date = new Date(dateInput);
  const formatter = new Intl.DateTimeFormat('fr-BE', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const year = parts.find((p) => p.type === 'year')?.value || '2026';

  return `${year}-${month}-${day}`;
}

/**
 * Formate l'heure au format HH:mm (Europe/Brussels).
 */
export function formatTimeBrussels(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('fr-BE', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Formate une date YYYY-MM-DD pour un affichage lisible (ex: "Jeudi 17 septembre 2026").
 */
export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Calcule l'année scolaire associée à une date donnée.
 * Exemple: 17 sept 2026 -> "2026-2027", 15 jan 2027 -> "2026-2027".
 */
export function getSchoolYearRange(dateStr: string): { start: string; end: string } {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(5, 7), 10);
  let startYear = year;
  if (month < 9) {
    startYear = year - 1;
  }
  return {
    start: `${startYear}-09-01`,
    end: `${startYear + 1}-08-31`,
  };
}

/**
 * Retourne les bornes du mois courant pour une date YYYY-MM-DD.
 */
export function getMonthRange(dateStr: string): { start: string; end: string } {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(5, 7), 10);
  const lastDay = new Date(year, month, 0).getDate();
  const monthPadded = month.toString().padStart(2, '0');
  const lastDayPadded = lastDay.toString().padStart(2, '0');
  return {
    start: `${year}-${monthPadded}-01`,
    end: `${year}-${monthPadded}-${lastDayPadded}`,
  };
}
