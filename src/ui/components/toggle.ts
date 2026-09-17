/**
 * Bascule segmentée réutilisable (ex: Entraînement / Course, F / M).
 */

export interface ToggleOption {
  value: string;
  label: string;
}

export function renderSegmentedToggle(
  options: ToggleOption[],
  selectedValue: string,
  containerClass = ''
): string {
  const optionsHtml = options
    .map(
      (opt) => `
    <button type="button" class="segmented-option ${opt.value === selectedValue ? 'active' : ''}" data-value="${opt.value}">
      ${opt.label}
    </button>
  `
    )
    .join('');

  return `
    <div class="segmented-control ${containerClass}">
      ${optionsHtml}
    </div>
  `;
}

export function setupSegmentedToggleEvents(
  container: HTMLElement,
  onSelect: (value: string) => void
): void {
  const buttons = container.querySelectorAll<HTMLButtonElement>('.segmented-option');
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const val = btn.dataset.value;
      if (val) {
        // Mettre à jour la classe active visuellement
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(val);
      }
    });
  });
}
