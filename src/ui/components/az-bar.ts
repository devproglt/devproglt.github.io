import type { StudentRecord } from '../../db/schema';
import { normalizeText } from '../../domain/normalize';

/**
 * Barre d'initiales A-Z sur 2 lignes continues visibles en permanence.
 * Ligne 1 : Tous + A à M
 * Ligne 2 : N à Z
 */
const ROW1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const ROW2 = ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export function computeAvailableLetters(students: StudentRecord[]): Set<string> {
  const letters = new Set<string>();
  for (const s of students) {
    const fn = normalizeText(s.firstName);
    const ln = normalizeText(s.lastName);
    if (fn.length > 0) {
      const char = fn.charAt(0).toUpperCase();
      if (char >= 'A' && char <= 'Z') letters.add(char);
    }
    if (ln.length > 0) {
      const char = ln.charAt(0).toUpperCase();
      if (char >= 'A' && char <= 'Z') letters.add(char);
    }
  }
  return letters;
}

function renderLetterBtn(letter: string, availableLetters: Set<string>, selectedLetter: string): string {
  const isAvailable = availableLetters.has(letter);
  const isSelected = selectedLetter === letter;

  let classNames = 'az-letter';
  if (isSelected) classNames += ' active';
  if (isAvailable) classNames += ' available';
  else classNames += ' disabled';

  return `
    <button type="button" class="${classNames}" data-letter="${letter}" ${!isAvailable && !isSelected ? 'disabled' : ''}>
      ${letter}
    </button>
  `;
}

export function renderAZBar(availableLetters: Set<string>, selectedLetter: string): string {
  const allSelected = selectedLetter === 'ALL' || !selectedLetter;

  const row1Html = ROW1.map((letter) => renderLetterBtn(letter, availableLetters, selectedLetter)).join('');
  const row2Html = ROW2.map((letter) => renderLetterBtn(letter, availableLetters, selectedLetter)).join('');

  return `
    <div class="az-bar-2rows" aria-label="Filtre par initiale">
      <div class="az-row">
        <button type="button" class="az-all-btn ${allSelected ? 'active' : 'available'}" data-letter="ALL">
          Tous
        </button>
        ${row1Html}
      </div>
      <div class="az-row">
        ${row2Html}
      </div>
    </div>
  `;
}

export function setupAZBarEvents(
  container: HTMLElement,
  getSelectedLetter: () => string,
  onSelectLetter: (letter: string) => void
): void {
  const bar = container.querySelector('.az-bar-2rows, .az-bar');
  if (!bar) return;

  bar.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>('.az-letter, .az-all-btn');
    if (!target || target.disabled) return;
    e.preventDefault();

    const clickedLetter = target.dataset.letter || 'ALL';
    const currentLetter = getSelectedLetter();

    let nextLetter: string;
    if (clickedLetter === 'ALL') {
      nextLetter = 'ALL';
    } else {
      // Toggle : un deuxième clic sur la lettre déjà sélectionnée la désélectionne (revient à "Tous")
      if (currentLetter === clickedLetter) {
        nextLetter = 'ALL';
      } else {
        nextLetter = clickedLetter;
      }
    }

    // Mise à jour visuelle immédiate des boutons dans le DOM
    const allBtn = bar.querySelector<HTMLButtonElement>('.az-all-btn');
    if (allBtn) {
      allBtn.classList.toggle('active', nextLetter === 'ALL');
    }

    const allLetterBtns = bar.querySelectorAll<HTMLButtonElement>('.az-letter');
    allLetterBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.letter === nextLetter);
    });

    onSelectLetter(nextLetter);
  });
}

export function updateAZBarAvailability(
  container: HTMLElement,
  availableLetters: Set<string>,
  selectedLetter: string
): void {
  const bar = container.querySelector('.az-bar-2rows, .az-bar');
  if (!bar) return;

  const allBtns = bar.querySelectorAll<HTMLButtonElement>('.az-letter');
  allBtns.forEach((btn) => {
    const letter = btn.dataset.letter;
    if (!letter || letter === 'ALL') return;
    const isAvail = availableLetters.has(letter);
    const isSel = selectedLetter === letter;
    btn.classList.toggle('available', isAvail);
    btn.classList.toggle('disabled', !isAvail && !isSel);
    btn.disabled = !isAvail && !isSel;
    btn.classList.toggle('active', isSel);
  });

  const allBtn = bar.querySelector<HTMLButtonElement>('.az-all-btn');
  if (allBtn) {
    allBtn.classList.toggle('active', selectedLetter === 'ALL' || !selectedLetter);
  }
}
