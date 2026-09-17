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

  // 3 copies répétées de A-Z pour un défilement infini et continu sans à-coup
  return `
    <div class="az-bar" aria-label="Filtre par initiale">
      <button type="button" class="az-all-btn ${allSelected ? 'active' : 'available'}" data-letter="ALL">
        Tous
      </button>
      <div class="az-letters-scroll">
        <div class="az-letters-set set-1">${lettersHtml}</div>
        <div class="az-letters-set set-2">${lettersHtml}</div>
        <div class="az-letters-set set-3">${lettersHtml}</div>
      </div>
    </div>
  `;
}

export function setupAZBarEvents(
  container: HTMLElement,
  getSelectedLetter: () => string,
  onSelectLetter: (letter: string) => void
): void {
  const bar = container.querySelector('.az-bar');
  if (!bar) return;

  const scrollContainer = bar.querySelector<HTMLElement>('.az-letters-scroll');
  if (scrollContainer) {
    // Centrer le défilement sur le Set 2 au chargement
    requestAnimationFrame(() => {
      const set1 = scrollContainer.querySelector<HTMLElement>('.set-1');
      if (set1) {
        const setWidth = set1.offsetWidth;
        if (setWidth > 0) {
          scrollContainer.scrollLeft = setWidth;
        }
      }
    });

    // Boucle infinie continue au défilement horizontal
    scrollContainer.addEventListener(
      'scroll',
      () => {
        const set1 = scrollContainer.querySelector<HTMLElement>('.set-1');
        if (!set1) return;
        const setWidth = set1.offsetWidth;
        if (setWidth <= 0) return;

        if (scrollContainer.scrollLeft < setWidth * 0.1) {
          scrollContainer.scrollLeft += setWidth;
        } else if (scrollContainer.scrollLeft > setWidth * 1.9) {
          scrollContainer.scrollLeft -= setWidth;
        }
      },
      { passive: true }
    );
  }

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
  const bar = container.querySelector('.az-bar');
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
