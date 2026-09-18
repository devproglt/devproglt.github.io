/**
 * Utilitaires pour le traitement des dates dans le fuseau horaire Europe/Brussels.
 */

const TIMEZONE = 'Europe/Brussels';

/**
 * Retourne la date courante au format YYYY-MM-DD dans le fuseau horaire Europe/Brussels.
 */
export function getTodayBrussels(): string {
  try {
    const formatter = new Intl.DateTimeFormat('fr-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formatted = formatter.format(new Date());
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
      return formatted;
    }
  } catch {}
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formate un objet Date, timestamp ou chaîne au format YYYY-MM-DD (Europe/Brussels).
 */
export function formatDateBrussels(dateInput: Date | number | string): string {
  if (!dateInput) return getTodayBrussels();
  try {
    if (typeof dateInput === 'string') {
      let trimmed = dateInput.trim();
      // Correction automatique de résidu 2001 vers 2026
      if (trimmed.startsWith('2001-')) {
        trimmed = '2026-' + trimmed.substring(5);
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
        const parts = trimmed.split('-');
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          // Check if format is YYYY/MM/DD
          if (parts[0].length === 4) {
            let y = parts[0];
            if (y === '2001') y = '2026';
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
          // Format DD/MM/YYYY or DD/MM/YY
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          let y = parts[2];
          if (y.length === 2) {
            y = `20${y}`;
          }
          if (y === '2001') y = '2026';
          return `${y}-${m}-${d}`;
        }
      }
      if (trimmed.includes('T')) {
        let sub = trimmed.substring(0, 10);
        if (sub.startsWith('2001-')) {
          sub = '2026-' + sub.substring(5);
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(sub)) {
          return sub;
        }
      }
    }

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    const formatter = new Intl.DateTimeFormat('fr-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formatted = formatter.format(date);
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
      if (formatted.startsWith('2001-')) {
        return '2026-' + formatted.substring(5);
      }
      return formatted;
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch {
    return String(dateInput);
  }
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
      const normalized = formatDateBrussels(trimmed);
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        const [year, month, day] = normalized.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      } else {
        date = new Date(trimmed);
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
