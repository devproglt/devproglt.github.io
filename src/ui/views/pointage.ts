import { STRINGS } from '../strings';
import { renderYearChips, setupYearChipsEvents } from '../components/chips';
import { renderAZBar, setupAZBarEvents, computeAvailableLetters, updateAZBarAvailability } from '../components/az-bar';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { applyAccentTheme } from '../components/header';
import { triggerHapticFeedback, showToast } from '../components/toast';
import {
  getFilteredStudents,
  createStudent,
  updateStudent,
  getStudentById,
  checkProbableDuplicate,
  type StudentRecord,
} from '../../db/students';
import { getAttendancesByEvent, toggleAttendance } from '../../db/attendances';
import { getEventsByDate, createEvent, updateEvent, type EventRecord } from '../../db/events';
import { getYearsList, addYearIfMissing } from '../../db/meta';
import { formatReadableDate } from '../../domain/dates';
import { db } from '../../db/schema';

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
  private isCreatingNewEvent = true;
  private isSessionDetailsExpanded = false;

  private students: StudentRecord[] = [];
  private allActiveStudents: StudentRecord[] = [];
  private attendanceMap = new Map<string, boolean>();
  private yearsList: string[] = [];

  constructor(container: HTMLElement, options: PointageViewOptions) {
    this.container = container;
    this.options = options;
    this.isCreatingNewEvent = !options.eventId;
  }

  public async updateOptions(options: PointageViewOptions): Promise<void> {
    this.options = options;
    this.isCreatingNewEvent = !options.eventId;
    await this.loadDataAndRender();
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    this.yearsList = await getYearsList();
    this.dayEvents = await getEventsByDate(this.options.date);

    // Sélection de l'événement actif
    if (this.isCreatingNewEvent) {
      this.activeEvent = null;
      this.options.eventId = undefined;
    } else if (this.options.eventId) {
      this.activeEvent = this.dayEvents.find((e) => e.id === this.options.eventId) || null;
      if (!this.activeEvent) {
        this.isCreatingNewEvent = true;
      }
    } else {
      this.isCreatingNewEvent = true;
      this.activeEvent = null;
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

    // Si aucun événement n'existe ou si l'utilisateur est en mode création "+ Nouvelle entrée"
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
    let girlsCount = 0;
    let boysCount = 0;
    let internalsCount = 0;
    for (const s of this.allActiveStudents) {
      if (this.attendanceMap.get(s.id)) {
        if (s.gender === 'F') girlsCount++;
        else boysCount++;
        if (s.isInternal) internalsCount++;
      }
    }

    const isPresence = this.activeEvent.type === 'presence';

    this.container.innerHTML = `
      <div style="padding: 8px 14px; display: flex; flex-direction: column; gap: 8px;">
        <!-- Cadre ultra-compact et extensible de la séance active -->
        <div class="pointage-summary-card">
          <div class="pointage-summary-row" id="pointage-summary-toggle">
            <div class="pointage-summary-left">
              <span class="badge-type-pill ${isPresence ? 'presence' : 'course'}">
                ${isPresence ? STRINGS.types.presence : STRINGS.types.course}
              </span>
              <span class="pointage-session-title" title="${this.escapeHtml(this.activeEvent.title)}">
                ${this.escapeHtml(this.activeEvent.title)}
              </span>
              <div class="pointage-totals-group">
                <span class="tot-badge">Tot: <strong>${presentCount}</strong></span>
                <span class="sub-tot g">G: <strong>${boysCount}</strong></span>
                <span class="sub-tot f">F: <strong>${girlsCount}</strong></span>
                <span class="sub-tot i">I: <strong>${internalsCount}</strong></span>
              </div>
            </div>

            <div class="pointage-summary-right">
              <button class="btn btn-primary btn-xs" id="pointage-validate-btn" title="Valider les inscriptions">
                ✓ Valider
              </button>
              <button class="btn-icon-toggle" id="pointage-expand-btn" aria-label="Afficher/masquer les détails">
                <svg class="chevron-icon ${this.isSessionDetailsExpanded ? 'expanded' : ''}" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Tiroir extensible de détails -->
          <div class="pointage-details-drawer" id="pointage-details-drawer" style="display: ${this.isSessionDetailsExpanded ? 'flex' : 'none'};">
            <div class="pointage-drawer-content">
              <div class="pointage-drawer-info">
                <div><strong>Date :</strong> ${formatReadableDate(this.options.date)}</div>
                ${this.activeEvent.description ? `<div><strong>Notes :</strong> ${this.escapeHtml(this.activeEvent.description)}</div>` : ''}
              </div>

              <div class="pointage-drawer-actions">
                ${this.dayEvents.length > 1 ? `
                  <select id="pointage-event-select" class="search-input-compact" style="width: auto;">
                    ${this.dayEvents.map((ev) => `<option value="${ev.id}" ${ev.id === this.activeEvent?.id ? 'selected' : ''}>${this.escapeHtml(ev.title)} (${ev.type === 'presence' ? 'Entraînement' : 'Course'})</option>`).join('')}
                  </select>
                ` : ''}
                <button class="btn btn-secondary btn-xs" id="pointage-edit-event-btn">
                  ✏️ Modifier séance
                </button>
                <button class="btn btn-secondary btn-xs" id="pointage-add-event-btn">
                  + Nouvelle entrée
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres et recherche sur une seule ligne + Alphabet en 2 lignes -->
        <div class="filter-section">
          <div class="filter-row-compact">
            <div class="search-bar-compact">
              <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></svg>
              <input type="search" id="pointage-search" class="search-input-compact" placeholder="Recherche..." value="${this.escapeHtml(this.searchQuery)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
              <button type="button" class="clear-search-btn-compact" id="pointage-clear-search" style="display: ${this.searchQuery ? 'flex' : 'none'};">✕</button>
            </div>

            <div id="pointage-year-chips" class="chips-container-compact">${renderYearChips(this.yearsList, this.selectedYears)}</div>
          </div>

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
    const typeToggleHtml = renderSegmentedToggle(
      [
        { value: 'presence', label: STRINGS.types.presence },
        { value: 'course', label: STRINGS.types.course },
      ],
      this.options.type
    );

    this.container.innerHTML = `
      <div style="padding: 16px 14px; display: flex; flex-direction: column; gap: 14px;">
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Nouvelle entrée
            </h3>
            <div id="pointage-cancel-create-container"></div>
          </div>

          <div id="pointage-existing-events-container"></div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              Titre de l'entrée
            </label>
            <input
              type="text"
              id="pointage-create-title"
              class="search-input"
              placeholder="${this.options.type === 'course' ? 'ex: Course départementale, Cross...' : 'ex: Entraînement Demi-fond...'}"
              autocomplete="off"
            />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
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
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              Type de séance
            </label>
            ${typeToggleHtml}
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              Notes / Remarques (Optionnel)
            </label>
            <input type="text" id="pointage-create-desc" class="search-input" placeholder="ex: Séance en extérieur, météo..." />
          </div>

          <button class="btn btn-primary" id="pointage-start-session-btn" style="width: 100%; min-height: 42px; margin-top: 4px; font-size: 0.9rem; font-weight: 700;">
            Démarrer le pointage
          </button>
        </div>
      </div>

      <div id="pointage-modal-container"></div>
    `;

    this.updateExistingEventsBanner();

    setupSegmentedToggleEvents(this.container, (val) => {
      const newType = val as 'presence' | 'course';
      this.options.type = newType;
      applyAccentTheme(newType);
      if (this.options.onTypeChange) {
        this.options.onTypeChange(newType);
      }
      const titleEl = this.container.querySelector<HTMLInputElement>('#pointage-create-title');
      if (titleEl) {
        titleEl.placeholder = newType === 'course' ? 'ex: Course départementale, Cross...' : 'ex: Entraînement Demi-fond...';
      }
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
          this.updateExistingEventsBanner();
        }
      };
      dateInput.addEventListener('input', onDateInput);
      dateInput.addEventListener('change', onDateInput);
    }

    const startBtn = this.container.querySelector('#pointage-start-session-btn');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        const titleInputEl = this.container.querySelector<HTMLInputElement>('#pointage-create-title');
        const dateInputEl = this.container.querySelector<HTMLInputElement>('#pointage-create-date');
        const descInputEl = this.container.querySelector<HTMLInputElement>('#pointage-create-desc');

        const typedTitle = titleInputEl?.value.trim() || '';
        const selectedDate = dateInputEl?.value.trim() || this.options.date;
        const customDesc = descInputEl?.value.trim() || '';

        const defaultTitle = this.options.type === 'course' ? 'Course' : 'Entraînement standard';
        const finalTitle = typedTitle || defaultTitle;

        const newEvent = await createEvent({
          date: selectedDate,
          type: this.options.type,
          title: finalTitle,
          description: customDesc,
        });

        showToast(`Séance « ${newEvent.title} » prête !`);
        this.options.date = selectedDate;
        this.options.eventId = newEvent.id;
        this.activeEvent = newEvent;
        this.isCreatingNewEvent = false;

        // Mise à jour de l'URL pour conserver l'eventId en cas de rafraîchissement
        try {
          window.location.hash = `#/pointage?eventId=${newEvent.id}&date=${selectedDate}&type=${newEvent.type}`;
        } catch (_) {}

        if (this.options.onEventChange) {
          this.options.onEventChange(newEvent.id, newEvent.date, newEvent.type);
        }
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private updateExistingEventsBanner(): void {
    const existingContainer = this.container.querySelector('#pointage-existing-events-container');
    const cancelContainer = this.container.querySelector('#pointage-cancel-create-container');
    if (!existingContainer) return;

    if (this.dayEvents.length > 0) {
      if (cancelContainer) {
        cancelContainer.innerHTML = `
          <button class="btn btn-secondary btn-xs" id="pointage-cancel-create-btn">
            Annuler
          </button>
        `;
        const cancelBtn = cancelContainer.querySelector('#pointage-cancel-create-btn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            const matchType = this.dayEvents.find((e) => e.type === this.options.type) || this.dayEvents[0];
            this.activeEvent = matchType;
            this.options.eventId = matchType.id;
            this.isCreatingNewEvent = false;
            this.loadDataAndRender();
          });
        }
      }

      existingContainer.innerHTML = `
        <div style="background: var(--bg-surface-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: var(--font-size-xs); font-weight: 700; color: var(--text-secondary);">
            Séance(s) existante(s) pour le ${formatReadableDate(this.options.date)} :
          </span>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${this.dayEvents.map((ev) => `
              <button type="button" class="btn btn-secondary btn-xs pointage-resume-ev-btn" data-event-id="${ev.id}">
                Reprendre « ${this.escapeHtml(ev.title)} » (${ev.type === 'presence' ? 'Entraînement' : 'Course'})
              </button>
            `).join('')}
          </div>
        </div>
      `;

      const resumeBtns = existingContainer.querySelectorAll<HTMLButtonElement>('.pointage-resume-ev-btn');
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
    } else {
      existingContainer.innerHTML = '';
      if (cancelContainer) {
        cancelContainer.innerHTML = '';
      }
    }
  }

  private renderStudentListHtml(): string {
    const studentCardsHtml = this.students
      .map((student) => {
        const isPresent = this.attendanceMap.get(student.id) || false;
        return `
          <div class="student-card-compact ${isPresent ? 'marked-present' : ''}" data-student-id="${student.id}">
            <div class="student-info-inline">
              <span class="student-name-compact">${this.escapeHtml(student.firstName)} ${this.escapeHtml(student.lastName)}</span>
              <span class="badge-year-compact">${this.escapeHtml(student.year)}</span>
              <span class="badge-gender-compact ${student.gender}">${student.gender === 'F' ? 'F' : 'G'}</span>
              ${student.isInternal ? `<span class="badge-internal-compact">Int.</span>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" class="btn-icon-subtle pointage-edit-student-btn" data-student-id="${student.id}" title="Modifier cet élève (nom, prénom, classe)">
                ✏️
              </button>
              <div class="check-indicator-compact">
                ${isPresent ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>` : ''}
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    const emptyMessageHtml = this.students.length === 0
      ? `<div style="text-align: center; padding: 20px 16px; color: var(--text-muted); font-size: 0.85rem;">Aucun élève ne correspond aux critères de recherche.</div>`
      : '';

    const addStudentCardHtml = `
      <div class="student-card-compact add-student-card-compact" id="pointage-add-student-card" style="cursor: pointer;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
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
    const editBtns = this.container.querySelectorAll<HTMLButtonElement>('.pointage-edit-student-btn');
    editBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const studentId = btn.dataset.studentId;
        if (studentId) {
          this.openEditStudentModal(studentId);
        }
      });
    });

    const cards = this.container.querySelectorAll<HTMLElement>(`#pointage-student-list .student-card-compact:not(#pointage-add-student-card)`);
    cards.forEach((card) => {
      card.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.pointage-edit-student-btn')) return;

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
          const indicator = card.querySelector('.check-indicator-compact');
          if (indicator) {
            indicator.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
          }
        } else {
          card.classList.remove('marked-present');
          const indicator = card.querySelector('.check-indicator-compact');
          if (indicator) {
            indicator.innerHTML = '';
          }
        }

        this.updateTotalsHeaderOnly();
        this.options.onRefreshNeeded();
      });
    });

    const addStudentCard = this.container.querySelector('#pointage-add-student-card');
    if (addStudentCard) {
      addStudentCard.addEventListener('click', () => {
        this.openAddStudentModal(this.searchQuery.trim());
      });
    }
  }

  private updateTotalsHeaderOnly(): void {
    const presentCount = this.attendanceMap.size;
    let girlsCount = 0;
    let boysCount = 0;
    let internalsCount = 0;
    for (const s of this.allActiveStudents) {
      if (this.attendanceMap.get(s.id)) {
        if (s.gender === 'F') girlsCount++;
        else boysCount++;
        if (s.isInternal) internalsCount++;
      }
    }

    const totalsGroup = this.container.querySelector('.pointage-totals-group');
    if (totalsGroup) {
      totalsGroup.innerHTML = `
        <span class="tot-badge">Tot: <strong>${presentCount}</strong></span>
        <span class="sub-tot g">G: <strong>${boysCount}</strong></span>
        <span class="sub-tot f">F: <strong>${girlsCount}</strong></span>
        <span class="sub-tot i">I: <strong>${internalsCount}</strong></span>
      `;
    }
  }

  private async openAddStudentModal(initialName = ''): Promise<void> {
    const modalContainer = this.container.querySelector('#pointage-modal-container');
    if (!modalContainer || !this.activeEvent) return;

    let selectedGender: 'F' | 'M' = 'F';
    let defaultFirst = '';
    let defaultLast = '';
    let isCustomClassMode = false;

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
            <button type="button" class="btn btn-secondary btn-xs" id="pointage-modal-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="pointage-new-student-form" style="display: flex; flex-direction: column; gap: 12px;">
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
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: var(--font-size-xs); font-weight: 600;">
                  ${STRINGS.student.year} (Classe) *
                </label>
                <button type="button" id="pointage-toggle-new-class-btn" style="background: none; border: none; font-size: 0.75rem; color: var(--accent-active); font-weight: 700; cursor: pointer; text-decoration: underline;">
                  + Créer une nouvelle classe
                </button>
              </div>
              <select id="pointage-form-year-select" class="search-input" style="appearance: auto;">
                ${this.yearsList
                  .map(
                    (yr) => `
                  <option value="${yr}" ${yr === defaultYear ? 'selected' : ''}>${yr}</option>
                `
                  )
                  .join('')}
                <option value="__new__">+ Autre classe...</option>
              </select>
              <div id="pointage-form-custom-class-container" style="display: none; margin-top: 6px;">
                <input type="text" id="pointage-form-custom-class-input" class="search-input" placeholder="Nom de la nouvelle classe (ex: 3C, 6G, Term 2...)" />
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="pointage-form-internal-checkbox" />
              <label for="pointage-form-internal-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                Élève Interne (EstInterne)
              </label>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary" id="pointage-form-cancel-btn" style="flex: 1; min-height: 40px;">
                ${STRINGS.actions.cancel}
              </button>
              <button type="button" class="btn btn-secondary" id="pointage-form-save-only-btn" style="flex: 1; min-height: 40px;">
                Créer seulement
              </button>
              <button type="submit" class="btn btn-primary" id="pointage-form-save-and-check-btn" style="flex: 1.4; min-height: 40px; font-weight: 700;">
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

    const yearSelect = modalContainer.querySelector<HTMLSelectElement>('#pointage-form-year-select');
    const customClassContainer = modalContainer.querySelector<HTMLElement>('#pointage-form-custom-class-container');
    const customClassInput = modalContainer.querySelector<HTMLInputElement>('#pointage-form-custom-class-input');
    const toggleNewClassBtn = modalContainer.querySelector('#pointage-toggle-new-class-btn');

    const showCustomClassField = () => {
      isCustomClassMode = true;
      if (customClassContainer) customClassContainer.style.display = 'block';
      if (yearSelect) yearSelect.value = '__new__';
      if (customClassInput) customClassInput.focus();
    };

    if (toggleNewClassBtn) toggleNewClassBtn.addEventListener('click', showCustomClassField);

    if (yearSelect) {
      yearSelect.addEventListener('change', () => {
        if (yearSelect.value === '__new__') {
          showCustomClassField();
        } else {
          isCustomClassMode = false;
          if (customClassContainer) customClassContainer.style.display = 'none';
        }
      });
    }

    const handleSave = async (andCheckPresent: boolean) => {
      const firstNameInput = modalContainer.querySelector<HTMLInputElement>('#pointage-form-first-name');
      const lastNameInput = modalContainer.querySelector<HTMLInputElement>('#pointage-form-last-name');
      const isInternal = modalContainer.querySelector<HTMLInputElement>('#pointage-form-internal-checkbox')?.checked ?? false;

      const firstName = firstNameInput?.value.trim() || '';
      const lastName = lastNameInput?.value.trim() || '';

      let year = yearSelect?.value.trim() || '1A';
      if (year === '__new__' || isCustomClassMode) {
        const typed = customClassInput?.value.trim();
        if (typed) year = typed;
      }

      if (!firstName || !lastName || !year || year === '__new__') {
        showToast('Veuillez remplir le prénom, le nom et la classe.');
        return;
      }

      await addYearIfMissing(year);
      this.yearsList = await getYearsList();

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

  private async openEditStudentModal(studentId: string): Promise<void> {
    const student = await getStudentById(studentId);
    if (!student) return;

    const modalContainer = this.container.querySelector('#pointage-modal-container');
    if (!modalContainer) return;

    let selectedGender: 'F' | 'M' = student.gender;
    let isCustomClassMode = false;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="pointage-edit-student-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Modifier l'élève
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="pointage-edit-student-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="pointage-edit-student-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div id="pointage-edit-dup-warning" class="past-date-banner" style="display: none;">
              ${STRINGS.student.duplicateWarning}
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.firstName} *
              </label>
              <input type="text" id="pointage-edit-first-name" class="search-input" value="${this.escapeHtml(student.firstName)}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.lastName} *
              </label>
              <input type="text" id="pointage-edit-last-name" class="search-input" value="${this.escapeHtml(student.lastName)}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.gender} *
              </label>
              <div id="pointage-edit-gender-toggle">
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
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: var(--font-size-xs); font-weight: 600;">
                  ${STRINGS.student.year} (Classe) *
                </label>
                <button type="button" id="pointage-edit-toggle-new-class-btn" style="background: none; border: none; font-size: 0.75rem; color: var(--accent-active); font-weight: 700; cursor: pointer; text-decoration: underline;">
                  + Créer une nouvelle classe
                </button>
              </div>
              <select id="pointage-edit-year-select" class="search-input" style="appearance: auto;">
                ${this.yearsList
                  .map(
                    (yr) => `
                  <option value="${yr}" ${student.year === yr ? 'selected' : ''}>${yr}</option>
                `
                  )
                  .join('')}
                <option value="__new__">+ Autre classe...</option>
              </select>
              <div id="pointage-edit-custom-class-container" style="display: none; margin-top: 6px;">
                <input type="text" id="pointage-edit-custom-class-input" class="search-input" placeholder="Nom de la nouvelle classe (ex: 3C, 6G, Term 2...)" />
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="pointage-edit-internal-checkbox" ${student.isInternal ? 'checked' : ''} />
              <label for="pointage-edit-internal-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                Élève Interne (EstInterne)
              </label>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.notes}
              </label>
              <textarea id="pointage-edit-notes" class="search-input" style="min-height: 60px; resize: vertical;">${this.escapeHtml(student.notes || '')}</textarea>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="pointage-edit-active-checkbox" ${student.active ? 'checked' : ''} />
              <label for="pointage-edit-active-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                ${STRINGS.student.active}
              </label>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary" id="pointage-edit-student-cancel-btn" style="flex: 1; min-height: 40px;">
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

    const overlay = modalContainer.querySelector('#pointage-edit-student-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
      });
    }

    const closeBtn = modalContainer.querySelector('#pointage-edit-student-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    const cancelBtn = modalContainer.querySelector('#pointage-edit-student-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);

    const genderContainer = modalContainer.querySelector('#pointage-edit-gender-toggle') as HTMLElement;
    if (genderContainer) {
      setupSegmentedToggleEvents(genderContainer, (val) => {
        selectedGender = val as 'F' | 'M';
      });
    }

    const firstNameInput = modalContainer.querySelector<HTMLInputElement>('#pointage-edit-first-name');
    const lastNameInput = modalContainer.querySelector<HTMLInputElement>('#pointage-edit-last-name');
    const yearSelect = modalContainer.querySelector<HTMLSelectElement>('#pointage-edit-year-select');
    const customClassContainer = modalContainer.querySelector<HTMLElement>('#pointage-edit-custom-class-container');
    const customClassInput = modalContainer.querySelector<HTMLInputElement>('#pointage-edit-custom-class-input');
    const toggleNewClassBtn = modalContainer.querySelector('#pointage-edit-toggle-new-class-btn');
    const warningBanner = modalContainer.querySelector<HTMLElement>('#pointage-edit-dup-warning');

    const showCustomClassField = () => {
      isCustomClassMode = true;
      if (customClassContainer) customClassContainer.style.display = 'block';
      if (yearSelect) yearSelect.value = '__new__';
      if (customClassInput) customClassInput.focus();
    };

    if (toggleNewClassBtn) toggleNewClassBtn.addEventListener('click', showCustomClassField);

    if (yearSelect) {
      yearSelect.addEventListener('change', () => {
        if (yearSelect.value === '__new__') {
          showCustomClassField();
        } else {
          isCustomClassMode = false;
          if (customClassContainer) customClassContainer.style.display = 'none';
        }
      });
    }

    const checkDuplicates = async () => {
      if (!firstNameInput || !lastNameInput || !yearSelect || !warningBanner) return;
      const fn = firstNameInput.value;
      const ln = lastNameInput.value;
      let yr = yearSelect.value;
      if (yr === '__new__' && customClassInput?.value.trim()) {
        yr = customClassInput.value.trim();
      }
      if (fn.trim() && ln.trim()) {
        const isDup = await checkProbableDuplicate(fn, ln, yr, student.id);
        warningBanner.style.display = isDup ? 'block' : 'none';
      }
    };

    if (firstNameInput) firstNameInput.addEventListener('input', checkDuplicates);
    if (lastNameInput) lastNameInput.addEventListener('input', checkDuplicates);
    if (yearSelect) yearSelect.addEventListener('change', checkDuplicates);
    if (customClassInput) customClassInput.addEventListener('input', checkDuplicates);

    const form = modalContainer.querySelector<HTMLFormElement>('#pointage-edit-student-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!firstNameInput || !lastNameInput || !yearSelect) return;

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        let year = yearSelect.value.trim();
        if (year === '__new__' || isCustomClassMode) {
          const typed = customClassInput?.value.trim();
          if (typed) year = typed;
        }

        const isInternal = modalContainer.querySelector<HTMLInputElement>('#pointage-edit-internal-checkbox')?.checked ?? false;
        const notes = (modalContainer.querySelector<HTMLTextAreaElement>('#pointage-edit-notes')?.value || '').trim();
        const active = modalContainer.querySelector<HTMLInputElement>('#pointage-edit-active-checkbox')?.checked ?? true;

        if (!firstName || !lastName || !year || year === '__new__') {
          showToast('Veuillez remplir les champs obligatoires.');
          return;
        }

        await addYearIfMissing(year);

        await updateStudent({
          id: student.id,
          firstName,
          lastName,
          gender: selectedGender,
          year,
          isInternal,
          notes,
          active,
        });

        showToast('Élève mis à jour avec succès.');
        closeOverlay();
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private async openEditEventModal(): Promise<void> {
    if (!this.activeEvent) return;
    const modalContainer = this.container.querySelector('#pointage-modal-container');
    if (!modalContainer) return;

    let selectedType: 'presence' | 'course' = this.activeEvent.type;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="pointage-edit-event-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Modifier les informations de la séance
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="pointage-edit-event-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="pointage-edit-event-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Titre de la séance *
              </label>
              <input type="text" id="edit-event-title" class="search-input" value="${this.escapeHtml(this.activeEvent.title)}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Date de la séance *
              </label>
              <input type="date" id="edit-event-date" class="search-input" value="${this.activeEvent.date}" style="min-height: 38px; padding: 4px 8px;" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Type de séance
              </label>
              <div id="edit-event-type-toggle">
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
                Notes / Remarques / Thème
              </label>
              <textarea id="edit-event-desc" class="search-input" style="min-height: 70px; resize: vertical;">${this.escapeHtml(this.activeEvent.description || '')}</textarea>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary" id="edit-event-cancel-btn" style="flex: 1; min-height: 40px;">
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

    const overlay = modalContainer.querySelector('#pointage-edit-event-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
      });
    }

    const closeBtn = modalContainer.querySelector('#pointage-edit-event-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    const cancelBtn = modalContainer.querySelector('#edit-event-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);

    const typeContainer = modalContainer.querySelector('#edit-event-type-toggle') as HTMLElement;
    if (typeContainer) {
      setupSegmentedToggleEvents(typeContainer, (val) => {
        selectedType = val as 'presence' | 'course';
      });
    }

    const form = modalContainer.querySelector<HTMLFormElement>('#pointage-edit-event-form');
    if (form && this.activeEvent) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titleInput = modalContainer.querySelector<HTMLInputElement>('#edit-event-title');
        const dateInput = modalContainer.querySelector<HTMLInputElement>('#edit-event-date');
        const descInput = modalContainer.querySelector<HTMLTextAreaElement>('#edit-event-desc');

        const title = titleInput?.value.trim() || 'Séance';
        const date = dateInput?.value.trim() || this.options.date;
        const description = descInput?.value.trim() || '';

        const eventId = this.activeEvent!.id;
        const oldDate = this.activeEvent!.date;
        const oldType = this.activeEvent!.type;

        const updated = await updateEvent(eventId, {
          title,
          date,
          type: selectedType,
          description,
        });

        if (updated) {
          this.activeEvent = updated;
        }

        if (date !== oldDate || selectedType !== oldType) {
          await db.attendances.where('eventId').equals(eventId).modify({
            date,
            type: selectedType,
            dirty: 1,
            updatedAt: Date.now(),
          });
        }

        this.options.date = date;
        this.options.type = selectedType;

        try {
          window.location.hash = `#/pointage?eventId=${eventId}&date=${date}&type=${selectedType}`;
        } catch (_) {}

        showToast('Séance mise à jour !');
        closeOverlay();
        if (this.options.onEventChange) {
          this.options.onEventChange(eventId, date, selectedType);
        }
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private attachEvents(): void {
    const expandBtn = this.container.querySelector('#pointage-expand-btn');
    const drawer = this.container.querySelector<HTMLElement>('#pointage-details-drawer');
    const chevron = this.container.querySelector('.chevron-icon');

    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isSessionDetailsExpanded = !this.isSessionDetailsExpanded;
        if (drawer) drawer.style.display = this.isSessionDetailsExpanded ? 'flex' : 'none';
        if (chevron) chevron.classList.toggle('expanded', this.isSessionDetailsExpanded);
      });
    }

    const summaryToggle = this.container.querySelector('#pointage-summary-toggle');
    if (summaryToggle) {
      summaryToggle.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('#pointage-validate-btn') || target.closest('#pointage-expand-btn')) return;
        this.isSessionDetailsExpanded = !this.isSessionDetailsExpanded;
        if (drawer) drawer.style.display = this.isSessionDetailsExpanded ? 'flex' : 'none';
        if (chevron) chevron.classList.toggle('expanded', this.isSessionDetailsExpanded);
      });
    }

    const editEventBtn = this.container.querySelector('#pointage-edit-event-btn');
    if (editEventBtn) {
      editEventBtn.addEventListener('click', () => {
        this.openEditEventModal();
      });
    }

    const validateBtn = this.container.querySelector('#pointage-validate-btn');
    if (validateBtn) {
      validateBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        showToast('Inscriptions validées !');
        const evId = this.activeEvent?.id;
        const evDate = this.options.date;
        const evType = this.options.type;

        this.activeEvent = null;
        this.options.eventId = undefined;
        this.isCreatingNewEvent = true;

        if (this.options.onCreationModeChange) {
          this.options.onCreationModeChange(true);
        }
        if (evId && this.options.onValidateSession) {
          this.options.onValidateSession(evId, evDate, evType);
        }
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
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
