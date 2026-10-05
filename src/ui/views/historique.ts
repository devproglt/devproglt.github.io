import { STRINGS } from '../strings';
import { showToast } from '../components/toast';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { getAllStudents, type StudentRecord } from '../../db/students';
import { getAllAttendances, type AttendanceRecord } from '../../db/attendances';
import { getAllEvents, updateEvent, createEvent, type EventRecord } from '../../db/events';
import { getYearsList } from '../../db/meta';
import { calculateAllStudentStats, extractYearLevel, type StudentStats } from '../../domain/stats';
import { formatReadableDate } from '../../domain/dates';
import { exportCurrentViewToExcel } from '../../io/export';
import { db } from '../../db/schema';

export interface HistoriqueViewOptions {
  onStudentCardClick: (studentId: string) => void;
  onInspectDateClick: (date: string, type?: 'presence' | 'course', eventId?: string) => void;
}

export type SortField = 'lastName' | 'firstName' | 'year' | 'presences' | 'courses' | 'total';
export type SortOrder = 'asc' | 'desc';

export class HistoriqueView {
  private container: HTMLElement;
  private options: HistoriqueViewOptions;

  private activeTab: 'students' | 'dates' = 'students';
  private yearFilter = 'all';
  private includeInactive = false;

  private sortField: SortField = 'lastName';
  private sortOrder: SortOrder = 'asc';

  private students: StudentRecord[] = [];
  private attendances: AttendanceRecord[] = [];
  private events: EventRecord[] = [];
  private yearsList: string[] = [];

  constructor(container: HTMLElement, options: HistoriqueViewOptions) {
    this.container = container;
    this.options = options;
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    const [years, students, attendances, events] = await Promise.all([
      getYearsList(),
      getAllStudents(),
      getAllAttendances(),
      getAllEvents(),
    ]);

    const distinctYearsSet = new Set<string>();
    for (const yr of years) {
      const level = extractYearLevel(yr);
      if (level) distinctYearsSet.add(level);
    }
    for (const s of students) {
      const level = extractYearLevel(s.year);
      if (level) distinctYearsSet.add(level);
    }
    this.yearsList = Array.from(distinctYearsSet).sort((a, b) =>
      a.localeCompare(b, 'fr', { numeric: true })
    );

    this.students = students;
    this.attendances = attendances;
    this.events = events;

    // Présences actives (toujours la totalité des données)
    const filteredAttendances = this.attendances.filter((a) => a.present);

    // Filtrage des élèves
    let filteredStudents = this.students;
    if (!this.includeInactive) {
      filteredStudents = filteredStudents.filter((s) => s.active);
    }
    if (this.yearFilter !== 'all') {
      filteredStudents = filteredStudents.filter((s) => extractYearLevel(s.year) === this.yearFilter);
    }

    const statsMap = calculateAllStudentStats(filteredAttendances);

    this.container.innerHTML = `
      <div style="padding: 12px 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <h2 style="font-size: 1.15rem; font-weight: 800;">${STRINGS.nav.historique}</h2>
          <button class="btn btn-primary btn-xs" id="historique-export-btn" style="min-height: 32px; padding: 0 12px; font-size: 0.8rem;">
            ${STRINGS.actions.exportExcel}
          </button>
        </div>

        <div>
          ${renderSegmentedToggle(
            [
              { value: 'students', label: STRINGS.stats.tabByStudent },
              { value: 'dates', label: STRINGS.stats.tabByDate },
            ],
            this.activeTab
          )}
        </div>

        ${this.activeTab === 'students' ? `
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px 10px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 140px;">
              <select id="historique-year-filter" class="search-input-compact" style="width: 100%; height: 32px; font-size: 0.78rem;">
                <option value="all">Toutes les années</option>
                ${this.yearsList.map((yr) => `<option value="${yr}" ${this.yearFilter === yr ? 'selected' : ''}>${yr}</option>`).join('')}
              </select>
            </div>

            <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; white-space: nowrap; cursor: pointer;">
              <input type="checkbox" id="historique-inactive-chk" ${this.includeInactive ? 'checked' : ''} />
              <span>Inclure inactifs</span>
            </label>
          </div>
        ` : ''}

        <!-- Vue contenu par Élève ou par Date -->
        ${this.activeTab === 'students'
          ? this.renderStudentsTableHtml(filteredStudents, statsMap)
          : this.renderDatesListHtml(filteredAttendances)}
      </div>

      <div id="historique-modal-container"></div>
    `;

    this.attachEvents(statsMap);
  }

  private renderStudentsTableHtml(students: StudentRecord[], statsMap: Map<string, StudentStats>): string {
    const studentRows = students.map((s) => {
      const stat = statsMap.get(s.id) || { presences: 0, courses: 0, total: 0, lastSeen: null, studentId: s.id };
      return { student: s, stat };
    });

    // Tri
    studentRows.sort((a, b) => {
      let comp = 0;
      if (this.sortField === 'lastName') comp = a.student.lastName.localeCompare(b.student.lastName, 'fr');
      else if (this.sortField === 'firstName') comp = a.student.firstName.localeCompare(b.student.firstName, 'fr');
      else if (this.sortField === 'year') comp = extractYearLevel(a.student.year).localeCompare(extractYearLevel(b.student.year), 'fr', { numeric: true });
      else if (this.sortField === 'presences') comp = a.stat.presences - b.stat.presences;
      else if (this.sortField === 'courses') comp = a.stat.courses - b.stat.courses;
      else if (this.sortField === 'total') comp = a.stat.total - b.stat.total;

      return this.sortOrder === 'asc' ? comp : -comp;
    });

    const getSortIndicator = (field: SortField) => {
      if (this.sortField !== field) return '';
      return this.sortOrder === 'asc' ? ' ▲' : ' ▼';
    };

    return `
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th data-sort="lastName">Nom${getSortIndicator('lastName')}</th>
              <th data-sort="firstName">Prénom${getSortIndicator('firstName')}</th>
              <th data-sort="year">Année${getSortIndicator('year')}</th>
              <th data-sort="presences">Prés.${getSortIndicator('presences')}</th>
              <th data-sort="courses">Cour.${getSortIndicator('courses')}</th>
              <th data-sort="total">Total${getSortIndicator('total')}</th>
            </tr>
          </thead>
          <tbody>
            ${studentRows.length === 0 ? `
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Aucune donnée disponible.</td></tr>
            ` : studentRows.map((item) => `
              <tr class="historique-student-row" data-student-id="${item.student.id}" style="cursor: pointer;">
                <td><strong>${this.escapeHtml(item.student.lastName)}</strong></td>
                <td>${this.escapeHtml(item.student.firstName)}</td>
                <td><span class="badge-year">${this.escapeHtml(extractYearLevel(item.student.year))}</span></td>
                <td><strong style="color: var(--accent-presence);">${item.stat.presences}</strong></td>
                <td><strong style="color: var(--accent-course);">${item.stat.courses}</strong></td>
                <td><strong>${item.stat.total}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderDatesListHtml(attendances: AttendanceRecord[]): string {
    const eventsMap = new Map<string, EventRecord>(this.events.map((e) => [e.id, e]));

    // Indexation des événements par date+type
    const primaryEventByDateAndType = new Map<string, EventRecord>();
    for (const ev of this.events) {
      const k = `${ev.date}_${ev.type}`;
      if (!primaryEventByDateAndType.has(k)) {
        primaryEventByDateAndType.set(k, ev);
      }
    }

    // Regroupement unifié des séances par date et type
    const sessionMap = new Map<
      string,
      {
        id: string;
        eventId?: string;
        date: string;
        type: 'presence' | 'course';
        title: string;
        description: string;
        studentSet: Set<string>;
      }
    >();

    // 1. Ajouter d'abord les événements connus
    for (const ev of this.events) {
      const groupKey = `${ev.date}_${ev.type}`;
      if (!sessionMap.has(groupKey)) {
        sessionMap.set(groupKey, {
          id: ev.id,
          eventId: ev.id,
          date: ev.date,
          type: ev.type,
          title: ev.title || (ev.type === 'presence' ? STRINGS.types.presence : STRINGS.types.course),
          description: ev.description || '',
          studentSet: new Set<string>(),
        });
      }
    }

    // 2. Compter les présences uniques par séance
    for (const att of attendances) {
      if (!att.present) continue;
      const groupKey = `${att.date}_${att.type}`;
      let entry = sessionMap.get(groupKey);
      if (!entry) {
        const ev = att.eventId ? eventsMap.get(att.eventId) : primaryEventByDateAndType.get(groupKey);
        entry = {
          id: ev?.id || groupKey,
          eventId: ev?.id || undefined,
          date: att.date,
          type: att.type,
          title: ev?.title || (att.type === 'presence' ? STRINGS.types.presence : STRINGS.types.course),
          description: ev?.description || '',
          studentSet: new Set<string>(),
        };
        sessionMap.set(groupKey, entry);
      }
      entry.studentSet.add(att.studentId);
    }

    // Sessions ordonnées par date décroissante
    const sessions = Array.from(sessionMap.values())
      .map((s) => ({
        ...s,
        count: s.studentSet.size,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${sessions.length === 0 ? `
          <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
            Aucun pointage trouvé.
          </div>
        ` : sessions.map((s) => {
          const isPresence = s.type === 'presence';
          const badgeColor = isPresence ? 'var(--accent-presence)' : 'var(--accent-course)';
          const badgeBg = isPresence ? 'var(--accent-presence-light)' : 'var(--accent-course-light)';

          return `
            <div class="historique-date-card" data-date="${s.date}" data-type="${s.type}" data-event-id="${s.eventId || ''}" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 8px;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary);">${this.escapeHtml(s.title)}</div>
                ${s.description ? `
                  <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${this.escapeHtml(s.description)}
                  </div>
                ` : ''}
                <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px;">
                  ${formatReadableDate(s.date)}
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 3px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;">
                  ${isPresence ? STRINGS.types.presence : STRINGS.types.course} (${s.count})
                </span>
                <button type="button" class="btn btn-secondary btn-xs historique-edit-session-btn" data-event-id="${s.eventId || ''}" data-date="${s.date}" data-type="${s.type}" data-title="${this.escapeHtml(s.title)}" data-desc="${this.escapeHtml(s.description)}" style="min-height: 28px; padding: 0 8px; font-size: 0.75rem;">
                  ✏️ Modifier
                </button>
                <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 700;">→</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private openEditSessionModal(sessionData: {
    eventId?: string;
    date: string;
    type: 'presence' | 'course';
    title: string;
    description: string;
  }): void {
    const modalContainer = this.container.querySelector('#historique-modal-container');
    if (!modalContainer) return;

    let selectedType: 'presence' | 'course' = sessionData.type;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="historique-edit-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Modifier les informations de la séance
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="historique-edit-modal-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="historique-edit-session-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Titre de la séance *
              </label>
              <input type="text" id="hist-edit-title" class="search-input" value="${this.escapeHtml(sessionData.title)}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Date de la séance *
              </label>
              <input type="date" id="hist-edit-date" class="search-input" value="${sessionData.date}" style="min-height: 38px; padding: 4px 8px;" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Type de séance
              </label>
              <div id="hist-edit-type-toggle">
                ${renderSegmentedToggle(
                  [
                    { value: 'presence', label: STRINGS.types.presence },
                    { value: 'course', label: STRINGS.types.course },
                  ],
                  selectedType
                )}
              </div>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Notes / Remarques / Thème (Détails supplémentaires)
              </label>
              <textarea id="hist-edit-desc" class="search-input" style="min-height: 70px; resize: vertical;">${this.escapeHtml(sessionData.description || '')}</textarea>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary" id="hist-edit-cancel-btn" style="flex: 1; min-height: 40px;">
                ${STRINGS.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1.5; min-height: 40px; font-weight: 700;">
                ${STRINGS.actions.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeOverlay = () => {
      modalContainer.innerHTML = '';
    };

    const overlay = modalContainer.querySelector('#historique-edit-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
      });
    }

    const closeBtn = modalContainer.querySelector('#historique-edit-modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    const cancelBtn = modalContainer.querySelector('#hist-edit-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);

    const typeToggleContainer = modalContainer.querySelector('#hist-edit-type-toggle') as HTMLElement;
    if (typeToggleContainer) {
      setupSegmentedToggleEvents(typeToggleContainer, (val) => {
        selectedType = val as 'presence' | 'course';
      });
    }

    const form = modalContainer.querySelector<HTMLFormElement>('#historique-edit-session-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titleInput = modalContainer.querySelector<HTMLInputElement>('#hist-edit-title');
        const dateInput = modalContainer.querySelector<HTMLInputElement>('#hist-edit-date');
        const descInput = modalContainer.querySelector<HTMLTextAreaElement>('#hist-edit-desc');

        const newTitle = titleInput?.value.trim() || 'Séance';
        const newDate = dateInput?.value.trim() || sessionData.date;
        const newDesc = descInput?.value.trim() || '';

        const origEventId = sessionData.eventId;
        const origDate = sessionData.date;
        const origType = sessionData.type;

        if (origEventId) {
          await updateEvent(origEventId, {
            title: newTitle,
            date: newDate,
            type: selectedType,
            description: newDesc,
          });

          if (newDate !== origDate || selectedType !== origType) {
            await db.attendances.where('eventId').equals(origEventId).modify({
              date: newDate,
              type: selectedType,
              dirty: 1,
              updatedAt: Date.now(),
            });
          }
        } else {
          // Créer l'événement dans la base de données
          const newEvent = await createEvent({
            date: newDate,
            type: selectedType,
            title: newTitle,
            description: newDesc,
          });

          await db.attendances.where('[date+type]').equals([origDate, origType]).modify({
            eventId: newEvent.id,
            date: newDate,
            type: selectedType,
            dirty: 1,
            updatedAt: Date.now(),
          });
        }

        showToast('Séance mise à jour !');
        closeOverlay();
        await this.loadDataAndRender();
      });
    }
  }

  private attachEvents(
    statsMap: Map<string, StudentStats>
  ): void {
    setupSegmentedToggleEvents(this.container, (val) => {
      this.activeTab = val as 'students' | 'dates';
      this.loadDataAndRender();
    });

    // Bouton d'exportation Excel
    const exportBtn = this.container.querySelector('#historique-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        try {
          showToast('Génération du fichier Excel en cours...');
          await exportCurrentViewToExcel(this.students, this.attendances, statsMap);
          showToast('Exportation Excel réussie !');
        } catch (err) {
          console.error(err);
          showToast('Erreur lors de l\'exportation Excel.');
        }
      });
    }

    const yearFilterSelect = this.container.querySelector<HTMLSelectElement>('#historique-year-filter');
    if (yearFilterSelect) {
      yearFilterSelect.addEventListener('change', () => {
        this.yearFilter = yearFilterSelect.value;
        this.loadDataAndRender();
      });
    }

    const inactiveChk = this.container.querySelector<HTMLInputElement>('#historique-inactive-chk');
    if (inactiveChk) {
      inactiveChk.addEventListener('change', () => {
        this.includeInactive = inactiveChk.checked;
        this.loadDataAndRender();
      });
    }

    // En-têtes de colonnes triables
    const headers = this.container.querySelectorAll<HTMLTableCellElement>('th[data-sort]');
    headers.forEach((th) => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort as SortField;
        if (this.sortField === field) {
          this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortField = field;
          this.sortOrder = 'asc';
        }
        this.loadDataAndRender();
      });
    });

    // Navigation rangées élèves
    const studentRows = this.container.querySelectorAll<HTMLElement>('.historique-student-row');
    studentRows.forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.studentId;
        if (id) this.options.onStudentCardClick(id);
      });
    });

    // Boutons de modification directe de séance
    const editSessionBtns = this.container.querySelectorAll<HTMLButtonElement>('.historique-edit-session-btn');
    editSessionBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = btn.dataset.eventId || undefined;
        const date = btn.dataset.date || '';
        const type = (btn.dataset.type || 'presence') as 'presence' | 'course';
        const title = btn.dataset.title || '';
        const description = btn.dataset.desc || '';

        this.openEditSessionModal({
          eventId,
          date,
          type,
          title,
          description,
        });
      });
    });

    // Navigation cartes de dates / séances
    const dateCards = this.container.querySelectorAll<HTMLElement>('.historique-date-card');
    dateCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.historique-edit-session-btn')) return;

        const dateStr = card.dataset.date;
        const type = (card.dataset.type || 'presence') as 'presence' | 'course';
        const eventId = card.dataset.eventId || undefined;
        if (dateStr) {
          this.options.onInspectDateClick(dateStr, type, eventId);
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
