import { STRINGS } from '../strings';
import { showToast } from '../components/toast';
import { getStudentById, updateStudent, deleteStudentPermanently, type StudentRecord } from '../../db/students';
import { getAttendancesByStudent } from '../../db/attendances';
import { getAllEvents, type EventRecord } from '../../db/events';
import { formatTimeBrussels, formatReadableDate } from '../../domain/dates';

export interface FicheViewOptions {
  studentId: string;
  onBack: () => void;
  onRefreshNeeded: () => void;
  onInspectSessionClick?: (date: string, type: 'presence' | 'course', eventId?: string) => void;
}

export class FicheView {
  private container: HTMLElement;
  private options: FicheViewOptions;
  private student: StudentRecord | null = null;
  private typeFilter: 'all' | 'presence' | 'course' = 'all';

  constructor(container: HTMLElement, options: FicheViewOptions) {
    this.container = container;
    this.options = options;
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    const student = await getStudentById(this.options.studentId);
    if (!student) {
      this.container.innerHTML = `
        <div style="padding: 24px; text-align: center;">
          <p>Élève introuvable.</p>
          <button class="btn btn-secondary" id="fiche-back-btn" style="margin-top: 16px;">Retour</button>
        </div>
      `;
      const btn = this.container.querySelector('#fiche-back-btn');
      if (btn) btn.addEventListener('click', this.options.onBack);
      return;
    }

    this.student = student;
    const [allAttendances, allEvents] = await Promise.all([
      getAttendancesByStudent(student.id),
      getAllEvents(),
    ]);
    const eventsMap = new Map<string, EventRecord>(allEvents.map((e) => [e.id, e]));
    const primaryEventByDateAndType = new Map<string, EventRecord>();
    for (const ev of allEvents) {
      const k = `${ev.date}_${ev.type}`;
      if (!primaryEventByDateAndType.has(k)) {
        primaryEventByDateAndType.set(k, ev);
      }
    }
    const presentAttendances = allAttendances.filter((a) => a.present);

    let presencesCount = 0;
    let coursesCount = 0;
    let lastSeen: string | null = null;

    for (const att of presentAttendances) {
      if (att.type === 'presence') presencesCount++;
      else if (att.type === 'course') coursesCount++;
      if (!lastSeen || att.date > lastSeen) {
        lastSeen = att.date;
      }
    }

    // Filtrage pour l'historique chronologique inversé
    let filteredList = presentAttendances;
    if (this.typeFilter !== 'all') {
      filteredList = filteredList.filter((a) => a.type === this.typeFilter);
    }
    filteredList.sort((a, b) => b.markedAt - a.markedAt);

    this.container.innerHTML = `
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; items-center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-secondary" id="fiche-back-btn" style="min-height: 38px; padding: 0 12px;">
            ← Retour
          </button>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="fiche-toggle-active-btn" style="min-height: 38px; padding: 0 10px; font-size: 0.8rem;">
              ${student.active ? 'Désactiver' : 'Réactiver'}
            </button>
            <button class="btn btn-danger" id="fiche-delete-btn" style="min-height: 38px; padding: 0 10px; font-size: 0.8rem;">
              Supprimer
            </button>
          </div>
        </div>

        <!-- En-tête Identité -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="font-size: var(--font-size-xl); font-weight: 700;">
                ${this.escapeHtml(student.firstName)} ${this.escapeHtml(student.lastName)}
              </h2>
              <div style="display: flex; gap: 8px; margin-top: 6px; align-items: center; flex-wrap: wrap;">
                <span class="badge-year">${this.escapeHtml(student.year)}</span>
                <span class="badge-gender ${student.gender}">${student.gender === 'F' ? 'Fille' : 'Garçon'}</span>
                ${student.isInternal ? `<span style="background: var(--bg-surface-hover); padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600;">Interne</span>` : ''}
                <span style="font-size: var(--font-size-xs); font-weight: 600; color: ${student.active ? 'var(--color-success)' : 'var(--color-danger)'}">
                  ${student.active ? '• Actif' : '• Inactif'}
                </span>
              </div>
              ${student.notes ? `
                <div style="margin-top: 10px; font-size: var(--font-size-sm); color: var(--text-secondary); background: var(--bg-surface-hover); padding: 8px 12px; border-radius: var(--radius-sm);">
                  Note : ${this.escapeHtml(student.notes)}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Grille des compteurs -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px; text-align: center;">
            <div style="background: var(--accent-presence-light); padding: 10px 4px; border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-presence);">${presencesCount}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--accent-presence);">${STRINGS.types.presence}s</div>
            </div>

            <div style="background: var(--accent-course-light); padding: 10px 4px; border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-course);">${coursesCount}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--accent-course);">${STRINGS.types.course}s</div>
            </div>

            <div style="background: var(--bg-surface-hover); padding: 10px 4px; border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">${presencesCount + coursesCount}</div>
              <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-secondary);">${STRINGS.stats.total}</div>
            </div>
          </div>

          <div style="margin-top: 12px; font-size: var(--font-size-xs); color: var(--text-muted); text-align: center;">
            ${STRINGS.student.lastSeen} : <strong>${lastSeen ? formatReadableDate(lastSeen) : STRINGS.student.never}</strong>
          </div>
        </div>

        <!-- Historique chronologique -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="font-size: var(--font-size-base);">${STRINGS.nav.historique} (${filteredList.length})</h3>
            <select id="fiche-type-filter" class="search-input" style="width: auto; min-height: 36px; padding: 0 8px; font-size: 0.8rem;">
              <option value="all" ${this.typeFilter === 'all' ? 'selected' : ''}>Tous les types</option>
              <option value="presence" ${this.typeFilter === 'presence' ? 'selected' : ''}>Entraînements</option>
              <option value="course" ${this.typeFilter === 'course' ? 'selected' : ''}>Courses</option>
            </select>
          </div>

          ${filteredList.length === 0 ? `
            <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              Aucun pointage enregistré pour cet élève.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${filteredList.map((att) => {
                const isPresence = att.type === 'presence';
                const badgeColor = isPresence ? 'var(--accent-presence)' : 'var(--accent-course)';
                const badgeBg = isPresence ? 'var(--accent-presence-light)' : 'var(--accent-course-light)';
                const event = att.eventId ? eventsMap.get(att.eventId) : primaryEventByDateAndType.get(`${att.date}_${att.type}`);
                const title = event ? event.title : (isPresence ? STRINGS.types.presence : STRINGS.types.course);

                return `
                  <div class="fiche-session-card" data-date="${att.date}" data-type="${att.type}" data-event-id="${att.eventId || ''}" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 8px;">
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--text-primary);">${this.escapeHtml(title)}</div>
                      ${event?.description ? `
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${this.escapeHtml(event.description)}
                        </div>
                      ` : ''}
                      <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px;">
                        ${formatReadableDate(att.date)} • ${formatTimeBrussels(att.markedAt)}
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                      <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;">
                        ${isPresence ? STRINGS.types.presence : STRINGS.types.course}
                      </span>
                      <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 700;">→</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const backBtn = this.container.querySelector('#fiche-back-btn');
    if (backBtn) backBtn.addEventListener('click', this.options.onBack);

    const toggleActiveBtn = this.container.querySelector('#fiche-toggle-active-btn');
    if (toggleActiveBtn && this.student) {
      toggleActiveBtn.addEventListener('click', async () => {
        if (!this.student) return;
        const newActiveState = !this.student.active;
        await updateStudent({ id: this.student.id, active: newActiveState });
        showToast(newActiveState ? 'Élève réactivé.' : 'Élève désactivé.');
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }

    const deleteBtn = this.container.querySelector('#fiche-delete-btn');
    if (deleteBtn && this.student) {
      deleteBtn.addEventListener('click', async () => {
        if (!this.student) return;
        if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${this.student.firstName} ${this.student.lastName} ainsi que tous ses pointages ?`)) {
          await deleteStudentPermanently(this.student.id);
          showToast(`Élève ${this.student.firstName} ${this.student.lastName} supprimé.`);
          this.options.onBack();
          this.options.onRefreshNeeded();
        }
      });
    }

    const typeFilterSelect = this.container.querySelector<HTMLSelectElement>('#fiche-type-filter');
    if (typeFilterSelect) {
      typeFilterSelect.addEventListener('change', () => {
        this.typeFilter = typeFilterSelect.value as 'all' | 'presence' | 'course';
        this.loadDataAndRender();
      });
    }

    const sessionCards = this.container.querySelectorAll<HTMLElement>('.fiche-session-card');
    sessionCards.forEach((card) => {
      card.addEventListener('click', () => {
        const dateStr = card.dataset.date;
        const type = (card.dataset.type || 'presence') as 'presence' | 'course';
        const eventId = card.dataset.eventId || undefined;
        if (dateStr && this.options.onInspectSessionClick) {
          this.options.onInspectSessionClick(dateStr, type, eventId);
        }
      });
    });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
