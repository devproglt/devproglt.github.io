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
export function formatTimeBrussels(timestamp: number | string | Date): string {
  if (!timestamp) return '--:--';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '--:--';
    return new Intl.DateTimeFormat('fr-BE', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '--:--';
  }
}

/**
 * Formate une date YYYY-MM-DD ou Date ou timestamp pour un affichage lisible (ex: "Jeudi 17 septembre 2026").
 */
export function formatReadableDate(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  try {
    let date: Date;
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          // Format DD/MM/YYYY
          date = new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0));
        } else {
          date = new Date(trimmed);
        }
      } else if (trimmed.includes('-')) {
        const parts = trimmed.substring(0, 10).split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
        } else {
          date = new Date(trimmed);
        }
      } else {
        const num = Number(trimmed);
        date = isNaN(num) ? new Date(trimmed) : new Date(num);
      }
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) {
      return String(dateInput);
    }

    return new Intl.DateTimeFormat('fr-BE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(dateInput);
  }
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
