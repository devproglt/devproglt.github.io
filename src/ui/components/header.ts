import { STRINGS } from '../strings';
import { getTodayBrussels, formatReadableDate } from '../../domain/dates';

export interface HeaderState {
  date: string;
  type: 'presence' | 'course';
  syncStatus: 'synced' | 'pending' | 'offline';
  pendingCount: number;
  daySummary?: { total: number; girls: number; boys: number; internals: number };
  showTopo?: boolean;
}

export function applyAccentTheme(type: 'presence' | 'course'): void {
  const root = document.documentElement;
  if (type === 'presence') {
    root.style.setProperty('--accent-active', 'var(--accent-presence)');
    root.style.setProperty('--accent-active-light', 'var(--accent-presence-light)');
    root.style.setProperty('--accent-active-glow', 'var(--accent-presence-glow)');
  } else {
    root.style.setProperty('--accent-active', 'var(--accent-course)');
    root.style.setProperty('--accent-active-light', 'var(--accent-course-light)');
    root.style.setProperty('--accent-active-glow', 'var(--accent-course-glow)');
  }
}

export function renderHeader(state: HeaderState): string {
  applyAccentTheme(state.type);
  const today = getTodayBrussels();
  const isPastDate = state.date < today;

  let syncText = STRINGS.sync.synced;
  let syncClass = 'synced';
  if (state.syncStatus === 'pending') {
    syncText = STRINGS.sync.pending.replace('{count}', state.pendingCount.toString());
    syncClass = 'pending';
  } else if (state.syncStatus === 'offline') {
    syncText = STRINGS.sync.offline;
    syncClass = 'offline';
  }

  const summary = state.daySummary || { total: 0, girls: 0, boys: 0, internals: 0 };

  return `
    <header class="app-header">
      ${isPastDate && state.showTopo ? `<div class="past-date-banner">${STRINGS.header.dateWarning}</div>` : ''}

      <div class="header-top" style="${state.showTopo ? '' : 'margin-bottom: 0;'}">
        <div class="header-title">
          <span>${STRINGS.appName}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="sync-indicator ${syncClass}" id="header-sync-btn" title="État de la synchronisation">
            <span class="sync-dot"></span>
            <span>${syncText}</span>
          </button>

          <button class="btn btn-secondary" id="header-settings-btn" style="min-height: 38px; padding: 0 10px;" aria-label="${STRINGS.nav.parametres}">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
          </button>
        </div>
      </div>

      ${state.showTopo ? `
      <!-- Ligne Date fixe + Topo Total, G, F, I (Prise de présences uniquement) -->
      <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; margin-top: 4px;">
        <div class="header-date-badge" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 6px 10px; font-size: 0.8rem; font-weight: 700; white-space: nowrap; color: var(--text-primary); display: flex; align-items: center; justify-content: center;">
          ${formatReadableDate(state.date)}
        </div>
        
        <div id="header-summary-badge" style="flex: 1; display: flex; align-items: center; justify-content: space-around; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 6px 8px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; gap: 4px;">
          <span style="color: var(--accent-active); font-size: 0.88rem; font-weight: 800;">Tot: ${summary.total}</span>
          <span style="color: var(--text-secondary);">G: <strong style="color: #0284c7;">${summary.boys}</strong></span>
          <span style="color: var(--text-secondary);">F: <strong style="color: #db2777;">${summary.girls}</strong></span>
          <span style="color: var(--text-secondary);">I: <strong style="color: #10b981;">${summary.internals}</strong></span>
        </div>
      </div>
      ` : ''}
    </header>
  `;
}

export function setupHeaderEvents(
  container: HTMLElement,
  onSyncClick: () => void,
  onSettingsClick: () => void
): void {
  const syncBtn = container.querySelector('#header-sync-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', onSyncClick);
  }

  const settingsBtn = container.querySelector('#header-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', onSettingsClick);
  }
}

