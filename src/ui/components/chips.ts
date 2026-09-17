import { STRINGS } from '../strings';

/**
 * Puces d'années défilables avec sélection multiple ou option "Toutes".
 */

export function renderYearChips(yearsList: string[], selectedYears: string[]): string {
  const isAllSelected = selectedYears.length === 0 || selectedYears.includes('all');

  const allChip = `
    <button class="chip ${isAllSelected ? 'active' : ''}" data-year="all">
      ${STRINGS.header.allYears}
    </button>
  `;

  const yearChips = yearsList.map((yr) => {
    const isSelected = !isAllSelected && selectedYears.includes(yr);
    return `
      <button class="chip ${isSelected ? 'active' : ''}" data-year="${yr}">
        ${yr}
      </button>
    `;
  }).join('');

  return `
    <div class="chips-scroll" aria-label="Filtre par année scolaire">
      ${allChip}
      ${yearChips}
    </div>
  `;
}

export function setupYearChipsEvents(
  container: HTMLElement,
  selectedYears: string[],
  onYearsChanged: (years: string[]) => void
): void {
  const buttons = container.querySelectorAll<HTMLButtonElement>('.chip');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const year = btn.dataset.year;
      if (!year) return;

      if (year === 'all') {
        onYearsChanged(['all']);
        return;
      }

      let next = selectedYears.filter((y) => y !== 'all');
      if (next.includes(year)) {
        next = next.filter((y) => y !== year);
      } else {
        next.push(year);
      }

      if (next.length === 0) {
        next = ['all'];
      }

      onYearsChanged(next);
    });
  });
}
