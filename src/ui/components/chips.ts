import { STRINGS } from '../strings';

/**
 * Extrait les niveaux d'années principaux (ex: "1A", "1B" -> "1", "6A", "6B" -> "6").
 */
export function extractYearLevels(yearsList: string[]): string[] {
  const levels = new Set<string>();
  for (const yr of yearsList) {
    const trimmed = yr.trim();
    if (!trimmed) continue;
    // Extraire le premier chiffre ou le premier groupe de caractères avant les lettres
    const match = trimmed.match(/^(\d+|\D+)/);
    const level = match ? match[1] : trimmed;
    levels.add(level);
  }
  // Trier numériquement si possible
  return Array.from(levels).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

export function renderYearChips(yearsList: string[], selectedYears: string[]): string {
  const levels = extractYearLevels(yearsList);
  const isAllSelected = selectedYears.length === 0 || selectedYears.includes('all');

  const allChip = `
    <button type="button" class="chip ${isAllSelected ? 'active' : ''}" data-year="all">
      ${STRINGS.header.allYears}
    </button>
  `;

  const levelChips = levels.map((lvl) => {
    const isSelected = !isAllSelected && selectedYears.includes(lvl);
    return `
      <button type="button" class="chip ${isSelected ? 'active' : ''}" data-year="${lvl}">
        ${lvl}
      </button>
    `;
  }).join('');

  return `
    <div class="chips-scroll" aria-label="Filtre par année scolaire">
      ${allChip}
      ${levelChips}
    </div>
  `;
}

export function setupYearChipsEvents(
  container: HTMLElement,
  getSelectedYears: () => string[],
  onYearsChanged: (years: string[]) => void
): void {
  const chipsScroll = container.querySelector('.chips-scroll');
  if (!chipsScroll) return;

  const buttons = chipsScroll.querySelectorAll<HTMLButtonElement>('.chip');
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const year = btn.dataset.year;
      if (!year) return;

      const currentSelected = getSelectedYears();
      let next: string[];

      if (year === 'all') {
        next = ['all'];
      } else {
        next = currentSelected.filter((y) => y !== 'all');
        if (next.includes(year)) {
          next = next.filter((y) => y !== year);
        } else {
          next.push(year);
        }

        if (next.length === 0) {
          next = ['all'];
        }
      }

      // Mise à jour visuelle immédiate des classes .active sur tous les boutons chips
      const isAll = next.includes('all');
      buttons.forEach((b) => {
        const bYear = b.dataset.year;
        if (bYear === 'all') {
          b.classList.toggle('active', isAll);
        } else if (bYear) {
          b.classList.toggle('active', !isAll && next.includes(bYear));
        }
      });

      onYearsChanged(next);
    });
  });
}
