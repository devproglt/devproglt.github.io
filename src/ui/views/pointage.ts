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
  onEventChange?: (eventId: string, date: string, type: 'presence' | 'course') => void;
  onCreationModeChange?: (isCreating: boolean) => void;
  onValidateSession?: (eventId: string, date: string, type: 'presence' | 'course') => void;
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
    if (!this.activeEvent && this.dayEvents.length > 0 && !this.isCreatingNewEvent) {
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

    // Si aucun événement n'existe ou si l'utilisateur a cliqué sur "+ Nouvelle entrée"
    if (!this.activeEvent || this.isCreatingNewEvent) {
      if (this.options.onCreationModeChange) {
        this.options.onCreationModeChange(true);
      }
      this.renderEventCreationForm();
      return;
    }

    if (this.options.onCreationModeChange) {
      this.options.onCreationModeChange(false);
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
              <span style="padding: 2px 8px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 700; background: var(--accent-${isPresence ? 'presence' : 'course'}-light); color: var(--accent-${isPresence ? 'presence' : 'course'});">
                ${isPresence ? STRINGS.types.presence : STRINGS.types.course}
              </span>
              <div>
                <strong style="font-size: var(--font-size-base); color: var(--text-primary);">
                  ${this.escapeHtml(this.activeEvent.title)}
                </strong>
                <div style="font-size: var(--font-size-xs); color: var(--text-muted);">
                  ${formatReadableDate(this.options.date)} • <span style="font-weight: 700; color: var(--accent-active);">${presentCount} présent(s)</span>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              ${this.dayEvents.length > 1 ? `
                <select id="pointage-event-select" class="search-input" style="width: auto; min-height: 34px; padding: 0 8px; font-size: 0.75rem;">
                  ${this.dayEvents.map((ev) => `<option value="${ev.id}" ${ev.id === this.activeEvent?.id ? 'selected' : ''}>${this.escapeHtml(ev.title)} (${ev.type === 'presence' ? 'Entraînement' : 'Course'})</option>`).join('')}
                </select>
              ` : ''}
              <button class="btn btn-primary" id="pointage-validate-btn" style="min-height: 34px; padding: 0 12px; font-size: 0.8rem; font-weight: 700;">
                Valider la séance
              </button>
              <button class="btn btn-secondary" id="pointage-add-event-btn" style="min-height: 34px; padding: 0 10px; font-size: 0.75rem;">
                + Nouvelle entrée
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

      <div id="pointage-modal-container"></div>
    `;

    this.attachEvents();
  }


  private renderEventCreationForm(): void {
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
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Nouvelle entrée
            </h3>
            ${hasExistingEvents ? `
              <button class="btn btn-secondary" id="pointage-cancel-create-btn" style="min-height: 32px; padding: 0 10px; font-size: 0.75rem;">
                Annuler
              </button>
            ` : ''}
          </div>

          ${hasExistingEvents ? `
            <div style="background: var(--bg-surface-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;">
              <span style="font-size: var(--font-size-xs); font-weight: 700; color: var(--text-secondary);">
                Séance(s) existante(s) pour le ${formatReadableDate(this.options.date)} :
              </span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${this.dayEvents.map((ev) => `
                  <button type="button" class="btn btn-secondary pointage-resume-ev-btn" data-event-id="${ev.id}" style="font-size: 0.8rem; padding: 6px 12px;">
                    Reprendre « ${this.escapeHtml(ev.title)} » (${ev.type === 'presence' ? 'Entraînement' : 'Course'})
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 6px;">
              Titre de l'entrée
            </label>
            <input
              type="text"
              id="pointage-create-title"
              class="search-input"
              placeholder="Nouvelle entrée"
              autocomplete="off"
            />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span>Date de l'entrée</span>
              <span id="pointage-create-date-readable" style="font-weight: 500; color: var(--text-muted); font-size: 0.75rem;">
                ${formatReadableDate(this.options.date)}
              </span>
            </label>
            <input
              type="date"
              id="pointage-create-date"
              class="search-input"
              value="${this.options.date}"
              style="min-height: 38px; padding: 4px 8px; font-size: 0.85rem;"
            />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 6px;">
              Type de séance
            </label>
            ${typeToggleHtml}
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 6px;">
              Notes / Remarques (Optionnel)
            </label>
            <input type="text" id="pointage-create-desc" class="search-input" placeholder="ex: Séance en extérieur, météo..." />
          </div>

          <button class="btn btn-primary" id="pointage-start-session-btn" style="width: 100%; min-height: 44px; margin-top: 6px; font-size: 0.95rem; font-weight: 700;">
            Démarrer le pointage
          </button>
        </div>
      </div>

      <div id="pointage-modal-container"></div>
    `;

    setupSegmentedToggleEvents(this.container, (val) => {
      const newType = val as 'presence' | 'course';
      this.options.type = newType;
      applyAccentTheme(newType);
    });

    const resumeBtns = this.container.querySelectorAll<HTMLButtonElement>('.pointage-resume-ev-btn');
    resumeBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const evId = btn.dataset.eventId;
        const found = this.dayEvents.find((e) => e.id === evId);
        if (found) {
          this.activeEvent = found;
          this.options.eventId = found.id;
          this.options.type = found.type;
          this.isCreatingNewEvent = false;
          if (this.options.onEventChange) {
            this.options.onEventChange(found.id, found.date, found.type);
          }
          await this.loadDataAndRender();
          this.options.onRefreshNeeded();
        }
      });
    });

    const titleInput = this.container.querySelector<HTMLInputElement>('#pointage-create-title');
    if (titleInput) {
      titleInput.addEventListener('focus', () => {
        titleInput.select();
      });
    }

    const dateInput = this.container.querySelector<HTMLInputElement>('#pointage-create-date');
    const dateReadable = this.container.querySelector<HTMLElement>('#pointage-create-date-readable');
    if (dateInput) {
      const onDateInput = async () => {
        if (dateInput.value) {
          this.options.date = dateInput.value;
          if (dateReadable) {
            dateReadable.textContent = formatReadableDate(dateInput.value);
          }
          this.dayEvents = await getEventsByDate(dateInput.value);
        }
      };
      dateInput.addEventListener('input', onDateInput);
      dateInput.addEventListener('change', onDateInput);
    }

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
        const titleInputEl = this.container.querySelector<HTMLInputElement>('#pointage-create-title');
        const dateInputEl = this.container.querySelector<HTMLInputElement>('#pointage-create-date');
        const descInputEl = this.container.querySelector<HTMLInputElement>('#pointage-create-desc');

        const customTitle = titleInputEl?.value.trim() || 'Nouvelle entrée';
        const selectedDate = dateInputEl?.value.trim() || this.options.date;
        const customDesc = descInputEl?.value.trim() || '';

        const newEvent = await createEvent({
          date: selectedDate,
          type: this.options.type,
          title: customTitle,
          description: customDesc,
        });

        showToast(`Séance « ${newEvent.title} » prête !`);
        this.options.date = selectedDate;
        this.options.eventId = newEvent.id;
        this.activeEvent = newEvent;
        this.isCreatingNewEvent = false;

        if (this.options.onEventChange) {
          this.options.onEventChange(newEvent.id, newEvent.date, newEvent.type);
        }
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private renderStudentListHtml(): string {
    const studentCardsHtml = this.students
      .map((student) => {
        const isPresent = this.attendanceMap.get(student.id) || false;
        return `
          <div class="student-card ${isPresent ? 'marked-present' : ''}" data-student-id="${student.id}">
            <div class="student-info">
              <div class="student-name">${this.escapeHtml(student.firstName)} ${this.escapeHtml(student.lastName)}</div>
              <div class="student-meta">
                <span class="badge-year">${this.escapeHtml(student.year)}</span>
                <span class="badge-gender ${student.gender}">${student.gender === 'F' ? 'Fille' : 'Garçon'}</span>
                ${student.isInternal ? `<span style="background: var(--bg-surface-hover); padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 600;">Interne</span>` : ''}
              </div>
            </div>
            <div class="check-indicator">
              ${isPresent ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    const emptyMessageHtml = this.students.length === 0
      ? `<div style="text-align: center; padding: 20px 16px; color: var(--text-muted); font-size: 0.88rem;">Aucun élève ne correspond aux critères de recherche.</div>`
      : '';

    const addStudentCardHtml = `
      <div class="student-card add-student-card" id="pointage-add-student-card" style="border: 2px dashed var(--accent-active); background: var(--bg-surface); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; margin-top: 8px; border-radius: var(--radius-md); color: var(--accent-active); font-weight: 700;">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        <span>+ Ajouter un nouvel élève</span>
      </div>
    `;

    return emptyMessageHtml + studentCardsHtml + addStudentCardHtml;
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
    const cards = this.container.querySelectorAll<HTMLElement>(`#pointage-student-list .student-card:not(#pointage-add-student-card)`);
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

    const addStudentCard = this.container.querySelector('#pointage-add-student-card');
    if (addStudentCard) {
      addStudentCard.addEventListener('click', () => {
        this.openAddStudentModal(this.searchQuery.trim());
      });
    }

    const quickAddBtn = this.container.querySelector('#pointage-add-quick');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => {
        this.openAddStudentModal(this.searchQuery.trim());
      });
    }
  }

  private async openAddStudentModal(initialName = ''): Promise<void> {
    const modalContainer = this.container.querySelector('#pointage-modal-container');
    if (!modalContainer || !this.activeEvent) return;

    let selectedGender: 'F' | 'M' = 'F';
    let defaultFirst = '';
    let defaultLast = '';

    if (initialName.trim()) {
      const parts = initialName.trim().split(' ');
      defaultFirst = parts[0] || '';
      defaultLast = parts.slice(1).join(' ') || '';
    }

    const defaultYear = this.selectedYears.find((y) => y !== 'all') || this.yearsList[0] || '1A';

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="pointage-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Ajouter un élève
            </h3>
            <button type="button" class="btn btn-secondary" id="pointage-modal-close-btn" style="min-height: 36px; padding: 0 10px;">✕</button>
          </div>

          <form id="pointage-new-student-form" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.firstName} *
              </label>
              <input type="text" id="pointage-form-first-name" class="search-input" value="${this.escapeHtml(defaultFirst)}" placeholder="ex: Lucas" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.lastName} *
              </label>
              <input type="text" id="pointage-form-last-name" class="search-input" value="${this.escapeHtml(defaultLast)}" placeholder="ex: Dubois" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.gender} *
              </label>
              <div id="pointage-form-gender-toggle">
                ${renderSegmentedToggle(
                  [
                    { value: 'F', label: STRINGS.student.female },
                    { value: 'M', label: STRINGS.student.male },
                  ],
                  selectedGender
                )}
              </div>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.year} *
              </label>
              <select id="pointage-form-year-select" class="search-input" style="appearance: auto;">
                ${this.yearsList
                  .map(
                    (yr) => `
                  <option value="${yr}" ${yr === defaultYear ? 'selected' : ''}>${yr}</option>
                `
                  )
                  .join('')}
              </select>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="pointage-form-internal-checkbox" />
              <label for="pointage-form-internal-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                Élève Interne (EstInterne)
              </label>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary" id="pointage-form-cancel-btn" style="flex: 1; min-height: 42px;">
                ${STRINGS.actions.cancel}
              </button>
              <button type="button" class="btn btn-secondary" id="pointage-form-save-only-btn" style="flex: 1; min-height: 42px;">
                Créer seulement
              </button>
              <button type="submit" class="btn btn-primary" id="pointage-form-save-and-check-btn" style="flex: 1.5; min-height: 42px; font-weight: 700;">
                Créer et pointer
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeOverlay = () => {
      modalContainer.innerHTML = '';
    };

    const overlay = modalContainer.querySelector('#pointage-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
      });
    }

    const closeBtn = modalContainer.querySelector('#pointage-modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    const cancelBtn = modalContainer.querySelector('#pointage-form-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);

    const genderContainer = modalContainer.querySelector('#pointage-form-gender-toggle') as HTMLElement;
    if (genderContainer) {
      setupSegmentedToggleEvents(genderContainer, (val) => {
        selectedGender = val as 'F' | 'M';
      });
    }

    const handleSave = async (andCheckPresent: boolean) => {
      const firstNameInput = modalContainer.querySelector<HTMLInputElement>('#pointage-form-first-name');
      const lastNameInput = modalContainer.querySelector<HTMLInputElement>('#pointage-form-last-name');
      const yearSelect = modalContainer.querySelector<HTMLSelectElement>('#pointage-form-year-select');
      const isInternal = modalContainer.querySelector<HTMLInputElement>('#pointage-form-internal-checkbox')?.checked ?? false;

      const firstName = firstNameInput?.value.trim() || '';
      const lastName = lastNameInput?.value.trim() || '';
      const year = yearSelect?.value.trim() || '1A';

      if (!firstName || !lastName || !year) {
        showToast('Veuillez remplir le prénom, le nom et la classe.');
        return;
      }

      const newStudent = await createStudent({
        firstName,
        lastName,
        gender: selectedGender,
        year,
        isInternal,
        active: true,
      });

      if (andCheckPresent && this.activeEvent) {
        await toggleAttendance(this.activeEvent.id, newStudent.id, this.options.date, this.activeEvent.type, true);
        this.attendanceMap.set(newStudent.id, true);
        showToast(`Élève ${firstName} ${lastName} créé et pointé !`);
      } else {
        showToast(`Élève ${firstName} ${lastName} créé.`);
      }

      closeOverlay();
      this.searchQuery = '';
      await this.loadDataAndRender();
      this.options.onRefreshNeeded();
    };

    const form = modalContainer.querySelector<HTMLFormElement>('#pointage-new-student-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSave(true);
      });
    }

    const saveOnlyBtn = modalContainer.querySelector('#pointage-form-save-only-btn');
    if (saveOnlyBtn) {
      saveOnlyBtn.addEventListener('click', () => {
        handleSave(false);
      });
    }
  }

  private attachEvents(): void {
    const validateBtn = this.container.querySelector('#pointage-validate-btn');
    if (validateBtn) {
      validateBtn.addEventListener('click', async () => {
        showToast('Séance enregistrée !');
        if (this.activeEvent && this.options.onValidateSession) {
          this.options.onValidateSession(this.activeEvent.id, this.options.date, this.options.type);
        } else {
          this.activeEvent = null;
          this.isCreatingNewEvent = true;
          if (this.options.onCreationModeChange) {
            this.options.onCreationModeChange(true);
          }
          await this.loadDataAndRender();
          this.options.onRefreshNeeded();
        }
      });
    }

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
            this.options.onEventChange(this.activeEvent.id, this.activeEvent.date, this.activeEvent.type);
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

