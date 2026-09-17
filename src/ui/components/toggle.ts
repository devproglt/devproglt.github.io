/**
 * Bascule segmentée réutilisable (ex: Présence / Course, F / M).
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
    <button class="segmented-option ${opt.value === selectedValue ? 'active' : ''}" data-value="${opt.value}">
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
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      if (val) {
        onSelect(val);
      }
    });
  });
}
