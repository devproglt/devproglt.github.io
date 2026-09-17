import { STRINGS } from '../strings';

export function renderNavbar(activeRoute: string): string {
  const isPointage = activeRoute === '#/pointage' || activeRoute === '' || activeRoute === '#/';
  const isJour = activeRoute.startsWith('#/jour');
  const isEleves = activeRoute.startsWith('#/eleves');
  const isHistorique = activeRoute.startsWith('#/historique');

  return `
    <nav class="app-navbar" aria-label="Navigation principale">
      <button class="nav-item ${isPointage ? 'active' : ''}" data-route="#/pointage" aria-label="${STRINGS.nav.pointage}">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span>${STRINGS.nav.pointage}</span>
      </button>

      <button class="nav-item ${isJour ? 'active' : ''}" data-route="#/jour" aria-label="${STRINGS.nav.jour}">
        <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
        <span>${STRINGS.nav.jour}</span>
      </button>

      <button class="nav-item ${isEleves ? 'active' : ''}" data-route="#/eleves" aria-label="${STRINGS.nav.eleves}">
        <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        <span>${STRINGS.nav.eleves}</span>
      </button>

      <button class="nav-item ${isHistorique ? 'active' : ''}" data-route="#/historique" aria-label="${STRINGS.nav.historique}">
        <svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>
        <span>${STRINGS.nav.historique}</span>
      </button>
    </nav>
  `;
}

export function setupNavbarEvents(container: HTMLElement, onNavigate: (route: string) => void): void {
  const buttons = container.querySelectorAll<HTMLButtonElement>('.nav-item');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      if (route) {
        onNavigate(route);
      }
    });
  });
}
