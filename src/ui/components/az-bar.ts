import type { StudentRecord } from '../../db/schema';
import { normalizeText } from '../../domain/normalize';

/**
 * Barre d'initiales A-Z.
 * Seules les lettres présentes dans les résultats sont actives.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

export function renderAZBar(availableLetters: Set<string>, selectedLetter: string): string {
  const lettersHtml = ALPHABET.map((letter) => {
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
  }).join('');

  const allSelected = selectedLetter === 'ALL' || !selectedLetter;

  return `
    <div class="az-bar" aria-label="Filtre par initiale">
      <button type="button" class="az-letter ${allSelected ? 'active' : 'available'}" data-letter="ALL">
        Tous
      </button>
      ${lettersHtml}
    </div>
  `;
}

export function setupAZBarEvents(container: HTMLElement, onSelectLetter: (letter: string) => void): void {
  const bar = container.querySelector('.az-bar');
  if (!bar) return;

  const buttons = bar.querySelectorAll<HTMLButtonElement>('.az-letter');
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const letter = btn.dataset.letter || 'ALL';

      buttons.forEach((b) => {
        b.classList.toggle('active', (b.dataset.letter || 'ALL') === letter);
      });

      onSelectLetter(letter);
    });
  });
}
