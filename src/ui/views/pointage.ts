import { STRINGS } from '../strings';
import { renderYearChips, setupYearChipsEvents } from '../components/chips';
import { renderAZBar, setupAZBarEvents, computeAvailableLetters, updateAZBarAvailability } from '../components/az-bar';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { applyAccentTheme } from '../components/header';
import { triggerHapticFeedback, showToast } from '../components/toast';
import { getFilteredStudents, createStudent, type StudentRecord } from '../../db/students';
import { getAttendancesByEvent, toggleAttendance } from '../../db/attendances';
import { getEventsByDate, createEvent, type EventRecord } from '../../db/events';
import { getYearsList } from '../../db/meta';
import { formatReadableDate } from '../../domain/dates';

export interface PointageViewOptions {
  date: string;
  type: 'presence' | 'course';
  eventId?: string;
  onStudentCardClick: (studentId: string) => void;
  onRefreshNeeded: () => void;
  onTypeChange?: (type: 'presence' | 'course') => void;
  onEventChange?: (eventId: string) => void;
}

export class PointageView {
  private container: HTMLElement;
  public options: PointageViewOptions;

  private searchQuery = '';
  private selectedYears: string[] = ['all'];
  private selectedLetter = 'ALL';

  private dayEvents: EventRecord[] = [];
  private activeEvent: EventRecord | null = null;
  private isCreatingNewEvent = false;

  private students: StudentRecord[] = [];
  private allActiveStudents: StudentRecord[] = [];
  private attendanceMap = new Map<string, boolean>();
  private yearsList: string[] = [];

  constructor(container: HTMLElement, options: PointageViewOptions) {
    this.container = container;
    this.options = options;
  }

  public async updateOptions(options: PointageViewOptions): Promise<void> {
    this.options = options;
    this.isCreatingNewEvent = false;
    await this.loadDataAndRender();
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    this.yearsList = await getYearsList();
    this.dayEvents = await getEventsByDate(this.options.date);

    // Sélection de l'événement actif
    if (this.options.eventId) {
      this.activeEvent = this.dayEvents.find((e) => e.id === this.options.eventId) || null;
    }
    if (!this.activeEvent && this.dayEvents.length > 0) {
      const matchType = this.dayEvents.find((e) => e.type === this.options.type);
      this.activeEvent = matchType || this.dayEvents[0];
    }

    if (this.activeEvent) {
      this.options.type = this.activeEvent.type;
      applyAccentTheme(this.activeEvent.type);
      if (this.options.onTypeChange) {
        this.options.onTypeChange(this.activeEvent.type);
      }
    } else {
      applyAccentTheme(this.options.type);
    }

    // Si aucun événement n'existe ou si l'utilisateur a cliqué sur "Nouvelle séance"
    if (!this.activeEvent || this.isCreatingNewEvent) {
      this.renderEventCreationForm();
      return;
    }

    // Récupérer les pointages de la séance active
    const attendances = await getAttendancesByEvent(this.activeEvent.id);
    this.attendanceMap.clear();
    for (const att of attendances) {
      if (att.present) {
        this.attendanceMap.set(att.studentId, true);
      }
    }

    this.allActiveStudents = await getFilteredStudents({ onlyActive: true });

    this.students = await getFilteredStudents({
      query: this.searchQuery,
      years: this.selectedYears,
      onlyActive: true,
      initialLetter: this.selectedLetter,
    });

    const availableLetters = computeAvailableLetters(
      this.selectedYears.includes('all')
        ? this.allActiveStudents
        : this.allActiveStudents.filter((s) => {
            const yr = s.year.trim();
            return this.selectedYears.some((lvl) => yr === lvl || yr.startsWith(lvl));
          })
    );

    const presentCount = this.attendanceMap.size;
    const isPresence = this.activeEvent.type === 'presence';

    this.container.innerHTML = `
      <div style="padding: 12px 16px; display: flex; flex-direction: column; gap: 12px;">
        <!-- Bannière de la séance active -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 12px 14px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem;">${isPresence ? '🏃' : '🏆'}</span>
              <div>
                <strong style="font-size: var(--font-size-base); color: var(--text-primary);">
                  ${this.escapeHtml(this.activeEvent.title)}
                </strong>
                <div style="font-size: var(--font-size-xs); color: var(--text-muted);">
                  ${formatReadableDate(this.options.date)} • <span style="font-weight: 700; color: var(--accent-active);">${presentCount} présent(s)</span>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 6px;">
              ${this.dayEvents.length > 1 ? `
                <select id="pointage-event-select" class="search-input" style="width: auto; min-height: 34px; padding: 0 8px; font-size: 0.75rem;">
                  ${this.dayEvents.map((ev) => `<option value="${ev.id}" ${ev.id === this.activeEvent?.id ? 'selected' : ''}>${ev.type === 'presence' ? '🏃' : '🏆'} ${this.escapeHtml(ev.title)}</option>`).join('')}
                </select>
              ` : ''}
              <button class="btn btn-secondary" id="pointage-add-event-btn" style="min-height: 34px; padding: 0 10px; font-size: 0.75rem;">
                ➕ Séance
              </button>
            </div>
          </div>
        </div>

        <!-- Filtres et recherche -->
        <div class="filter-section">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></svg>
            <input type="search" id="pointage-search" class="search-input" placeholder="${STRINGS.header.searchPlaceholder}" value="${this.escapeHtml(this.searchQuery)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
            <button type="button" class="clear-search-btn" id="pointage-clear-search" style="display: ${this.searchQuery ? 'flex' : 'none'};">✕</button>
          </div>

          <div id="pointage-year-chips">${renderYearChips(this.yearsList, this.selectedYears)}</div>

          <div id="pointage-az-bar">${renderAZBar(availableLetters, this.selectedLetter)}</div>
        </div>

        <div class="student-list" id="pointage-student-list" style="padding: 0;">
          ${this.renderStudentListHtml()}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private renderEventCreationForm(): void {
    const isPresence = this.options.type === 'presence';
    const hasExistingEvents = this.dayEvents.length > 0;

    const typeToggleHtml = renderSegmentedToggle(
      [
        { value: 'presence', label: STRINGS.types.presence },
        { value: 'course', label: STRINGS.types.course },
      ],
      this.options.type
    );

    this.container.innerHTML = `
      <div style="padding: 20px 16px; display: flex; flex-direction: column; gap: 16px;">
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: var(--font-size-base); font-weight: 700;">
              ✨ Nouvelle séance pour le ${formatReadableDate(this.options.date)}
            </h3>
            ${hasExistingEvents ? `
              <button class="btn btn-secondary" id="pointage-cancel-create-btn" style="min-height: 32px; padding: 0 10px; font-size: 0.75rem;">
                Annuler
              </button>
            ` : ''}
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 6px;">
              Type de séance
            </label>
            ${typeToggleHtml}
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 6px;">
              Titre / Nom de la séance
            </label>
            <input type="text" id="pointage-create-title" class="search-input" placeholder="${isPresence ? 'ex: Entraînement standard, Demi-fond, Piste...' : 'ex: Cross de rentrée, Compétition provinciale...'}" />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 6px;">
              Notes / Remarques (Optionnel)
            </label>
            <input type="text" id="pointage-create-desc" class="search-input" placeholder="ex: Séance en extérieur, météo pluvieuse..." />
          </div>

          <button class="btn btn-primary" id="pointage-start-session-btn" style="width: 100%; min-height: 44px; margin-top: 6px; font-size: 0.95rem; font-weight: 700;">
            🚀 Démarrer le pointage de cette séance
          </button>
        </div>
      </div>
    `;

    setupSegmentedToggleEvents(this.container, (val) => {
      const newType = val as 'presence' | 'course';
      this.options.type = newType;
      const titleInput = this.container.querySelector<HTMLInputElement>('#pointage-create-title');
      if (titleInput && !titleInput.value) {
        titleInput.placeholder = newType === 'presence'
          ? 'ex: Entraînement standard, Demi-fond, Piste...'
          : 'ex: Cross de rentrée, Compétition provinciale...';
      }
      applyAccentTheme(newType);
    });

    const cancelBtn = this.container.querySelector('#pointage-cancel-create-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.isCreatingNewEvent = false;
        this.loadDataAndRender();
      });
    }

    const startBtn = this.container.querySelector('#pointage-start-session-btn');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        const titleInput = this.container.querySelector<HTMLInputElement>('#pointage-create-title');
        const descInput = this.container.querySelector<HTMLInputElement>('#pointage-create-desc');
        const customTitle = titleInput ? titleInput.value.trim() : '';
        const customDesc = descInput ? descInput.value.trim() : '';

        const newEvent = await createEvent({
          date: this.options.date,
          type: this.options.type,
          title: customTitle,
          description: customDesc,
        });

        showToast(`Séance « ${newEvent.title} » créée !`);
        this.activeEvent = newEvent;
        this.isCreatingNewEvent = false;
        if (this.options.onEventChange) {
          this.options.onEventChange(newEvent.id);
        }
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private renderStudentListHtml(): string {
    if (this.students.length === 0) {
      const hasTypedQuery = this.searchQuery.trim().length > 0;
      return `
        <div style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
          <p>Aucun élève ne correspond aux critères de recherche.</p>
          ${hasTypedQuery ? `
            <button type="button" class="btn btn-primary" id="pointage-add-quick" style="margin-top: 16px;">
              ${STRINGS.actions.addStudent} « ${this.escapeHtml(this.searchQuery.trim())} »
            </button>
          ` : ''}
        </div>
      `;
    }

    return this.students
      .map((student) => {
        const isPresent = this.attendanceMap.get(student.id) || false;
        return `
          <div class="student-card ${isPresent ? 'marked-present' : ''}" data-student-id="${student.id}">
            <div class="student-info">
              <div class="student-name">${this.escapeHtml(student.firstName)} ${this.escapeHtml(student.lastName)}</div>
              <div class="student-meta">
                <span class="badge-year">${this.escapeHtml(student.year)}</span>
                <span class="badge-gender ${student.gender}">${student.gender === 'F' ? 'Fille' : 'Garçon'}</span>
                ${student.isInternal ? `<span style="background: var(--bg-surface-hover); padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 600;">🏠 Interne</span>` : ''}
              </div>
            </div>
            <div class="check-indicator">
              ${isPresent ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>` : ''}
            </div>
          </div>
        `;
      })
      .join('');
  }

  private async updateFilteredListOnly(): Promise<void> {
    this.students = await getFilteredStudents({
      query: this.searchQuery,
      years: this.selectedYears,
      onlyActive: true,
      initialLetter: this.selectedLetter,
    });

    const listContainer = this.container.querySelector('#pointage-student-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderStudentListHtml();
      this.attachCardEventsOnly();
    }

    const clearBtn = this.container.querySelector<HTMLElement>('#pointage-clear-search');
    if (clearBtn) {
      clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
    }

    const availableLetters = computeAvailableLetters(
      this.selectedYears.includes('all')
        ? this.allActiveStudents
        : this.allActiveStudents.filter((s) => {
            const yr = s.year.trim();
            return this.selectedYears.some((lvl) => yr === lvl || yr.startsWith(lvl));
          })
    );
    updateAZBarAvailability(this.container, availableLetters, this.selectedLetter);
  }

  private attachCardEventsOnly(): void {
    const cards = this.container.querySelectorAll<HTMLElement>(`#pointage-student-list .student-card`);
    cards.forEach((card) => {
      card.addEventListener('click', async () => {
        const studentId = card.dataset.studentId;
        if (!studentId || !this.activeEvent) return;

        triggerHapticFeedback();
        const newRecord = await toggleAttendance(
          this.activeEvent.id,
          studentId,
          this.options.date,
          this.activeEvent.type
        );
        this.attendanceMap.set(studentId, newRecord.present);

        if (newRecord.present) {
          card.classList.add('marked-present');
          const indicator = card.querySelector('.check-indicator');
          if (indicator) {
            indicator.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
          }
        } else {
          card.classList.remove('marked-present');
          const indicator = card.querySelector('.check-indicator');
          if (indicator) {
            indicator.innerHTML = '';
          }
        }

        this.options.onRefreshNeeded();
      });
    });

    const quickAddBtn = this.container.querySelector('#pointage-add-quick');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', async () => {
        if (!this.activeEvent) return;
        const typedName = this.searchQuery.trim();
        const parts = typedName.split(' ');
        const firstName = parts[0] || typedName;
        const lastName = parts.slice(1).join(' ') || 'Élève';

        const defaultYear = this.yearsList[0] || '1A';
        const newStudent = await createStudent({
          firstName,
          lastName,
          gender: 'F',
          year: defaultYear,
          active: true,
        });

        await toggleAttendance(this.activeEvent.id, newStudent.id, this.options.date, this.activeEvent.type, true);
        showToast(`Élève ${firstName} créé et pointé !`);
        this.searchQuery = '';
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private attachEvents(): void {
    const addEventBtn = this.container.querySelector('#pointage-add-event-btn');
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => {
        this.isCreatingNewEvent = true;
        this.renderEventCreationForm();
      });
    }

    const eventSelect = this.container.querySelector<HTMLSelectElement>('#pointage-event-select');
    if (eventSelect) {
      eventSelect.addEventListener('change', async () => {
        const selectedId = eventSelect.value;
        this.activeEvent = this.dayEvents.find((e) => e.id === selectedId) || null;
        if (this.activeEvent) {
          this.options.eventId = this.activeEvent.id;
          this.options.type = this.activeEvent.type;
          if (this.options.onEventChange) {
            this.options.onEventChange(this.activeEvent.id);
          }
          await this.loadDataAndRender();
          this.options.onRefreshNeeded();
        }
      });
    }

    const searchInput = this.container.querySelector<HTMLInputElement>('#pointage-search');
    if (searchInput) {
      const onSearchUpdate = () => {
        this.searchQuery = searchInput.value;
        this.updateFilteredListOnly();
      };
      searchInput.addEventListener('input', onSearchUpdate);
      searchInput.addEventListener('keyup', onSearchUpdate);
      searchInput.addEventListener('search', onSearchUpdate);
    }

    const clearSearchBtn = this.container.querySelector('#pointage-clear-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.searchQuery = '';
        if (searchInput) searchInput.value = '';
        this.updateFilteredListOnly();
      });
    }

    setupYearChipsEvents(
      this.container,
      () => this.selectedYears,
      (years) => {
        this.selectedYears = years;
        this.updateFilteredListOnly();
      }
    );

    setupAZBarEvents(
      this.container,
      () => this.selectedLetter,
      (letter) => {
        this.selectedLetter = letter;
        this.updateFilteredListOnly();
      }
    );

    this.attachCardEventsOnly();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
