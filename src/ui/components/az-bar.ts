/**
 * Barre d'initiales A-Z.
 * Seules les lettres présentes dans les résultats filtrés sont actives.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function renderAZBar(availableLetters: Set<string>, selectedLetter: string): string {
  const lettersHtml = ALPHABET.map((letter) => {
    const isAvailable = availableLetters.has(letter);
    const isSelected = selectedLetter === letter;

    let classNames = 'az-letter';
    if (isSelected) classNames += ' active';
    if (isAvailable) classNames += ' available';
    else classNames += ' disabled';

    return `
      <button class="${classNames}" data-letter="${letter}" ${!isAvailable && !isSelected ? 'disabled' : ''}>
        ${letter}
      </button>
    `;
  }).join('');

  const allSelected = selectedLetter === 'ALL' || !selectedLetter;

  return `
    <div class="az-bar" aria-label="Filtre par initiale du prénom">
      <button class="az-letter ${allSelected ? 'active' : 'available'}" data-letter="ALL">
        Tous
      </button>
      ${lettersHtml}
    </div>
  `;
}

export function setupAZBarEvents(container: HTMLElement, onSelectLetter: (letter: string) => void): void {
  const buttons = container.querySelectorAll<HTMLButtonElement>('.az-letter');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const letter = btn.dataset.letter || 'ALL';
      onSelectLetter(letter);
    });
  });
}
