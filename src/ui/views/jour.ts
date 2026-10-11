import { STRINGS } from '../strings';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { showToast } from '../components/toast';
import { db } from '../../db/schema';
import { getAttendancesByEvent, getAttendancesByDateAndType, toggleAttendance } from '../../db/attendances';
import { getEventsByDateAndType, getEventById, deleteEvent, updateEvent, createEvent, type EventRecord } from '../../db/events';
import { getAllStudents, type StudentRecord } from '../../db/students';
import { calculateDaySummary, extractYearLevel } from '../../domain/stats';
import { formatTimeBrussels, formatReadableDate } from '../../domain/dates';
import { generateAttendanceSummaryText } from '../../domain/summary';

export interface JourViewOptions {
  date: string;
  type: 'presence' | 'course';
  eventId?: string;
  onStudentCardClick: (studentId: string) => void;
  onRefreshNeeded: () => void;
  onDeleteSession?: () => void;
  onResumePointage?: (eventId?: string, date?: string, type?: 'presence' | 'course') => void;
}

export class JourView {
  private container: HTMLElement;
  private options: JourViewOptions;
  private activeTab: 'presence' | 'course';
  private currentEvent: EventRecord | null = null;

  constructor(container: HTMLElement, options: JourViewOptions) {
    this.container = container;
    this.options = options;
    this.activeTab = options.type;
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    // Récupérer l'événement concerné
    if (this.options.eventId) {
      this.currentEvent = await getEventById(this.options.eventId) || null;
      if (this.currentEvent) {
        this.activeTab = this.currentEvent.type;
      }
    } else {
      const events = await getEventsByDateAndType(this.options.date, this.activeTab);
      this.currentEvent = events[0] || null;
    }

    let attendances = [];
    if (this.currentEvent) {
      attendances = await getAttendancesByEvent(this.currentEvent.id);
    } else {
      attendances = await getAttendancesByDateAndType(this.options.date, this.activeTab);
    }

    const presentAttendances = attendances.filter((a) => a.present);
    const allStudents = await getAllStudents();
    const studentsMap = new Map<string, StudentRecord>(allStudents.map((s) => [s.id, s]));

    const summary = calculateDaySummary(presentAttendances, studentsMap, this.activeTab);

    // Liste des présents ordonnée par heure de pointage décroissante
    const presentList = presentAttendances
      .map((att) => ({
        attendance: att,
        student: studentsMap.get(att.studentId),
      }))
      .filter((item): item is { attendance: typeof item.attendance; student: StudentRecord } => Boolean(item.student))
      .sort((a, b) => b.attendance.markedAt - a.attendance.markedAt);

    // Liste des présents triée par année d'étude croissante, puis par prénom et nom pour le résumé copié
    const sortedForSummary = [...presentList].sort((a, b) => {
      const aYr = extractYearLevel(a.student.year || '');
      const bYr = extractYearLevel(b.student.year || '');
      const yearComp = aYr.localeCompare(bYr, 'fr', { numeric: true });
      if (yearComp !== 0) return yearComp;
      const fnComp = (a.student.firstName || '').localeCompare(b.student.firstName || '', 'fr');
      if (fnComp !== 0) return fnComp;
      return (a.student.lastName || '').localeCompare(b.student.lastName || '', 'fr');
    });

    const tabsToggleHtml = renderSegmentedToggle(
      [
        { value: 'presence', label: STRINGS.types.presence },
        { value: 'course', label: STRINGS.types.course },
      ],
      this.activeTab
    );

    const yearRowsHtml = Object.entries(summary.byYear)
      .sort(([a], [b]) => a.localeCompare(b, 'fr', { numeric: true }))
      .map(
        ([yr, counts]) => `
        <tr>
          <td><strong>${this.escapeHtml(yr)}</strong></td>
          <td>${counts.girls}</td>
          <td>${counts.boys}</td>
          <td>${counts.internals}</td>
          <td><strong>${counts.total}</strong></td>
        </tr>
      `
      )
      .join('');

    const eventTitle = this.currentEvent ? this.currentEvent.title : (this.activeTab === 'presence' ? STRINGS.types.presence : STRINGS.types.course);

    this.container.innerHTML = `
      <div style="padding: 12px 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <div>
            <h2 style="font-size: var(--font-size-lg); font-weight: 800;">${this.escapeHtml(eventTitle)}</h2>
            ${this.currentEvent?.description ? `
              <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: 2px;">
                ${this.escapeHtml(this.currentEvent.description)}
              </div>
            ` : ''}
            <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px;">
              ${formatReadableDate(this.options.date)}
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-xs" id="jour-resume-pointage-btn" style="min-height: 34px; padding: 0 12px; font-weight: 700;">
              Pointer / Inscriptions
            </button>
            <button class="btn btn-secondary btn-xs" id="jour-edit-info-btn" style="min-height: 34px; padding: 0 10px;">
              ✏️ Modifier infos
            </button>
            <button class="btn btn-secondary btn-xs" id="jour-copy-summary-btn" style="min-height: 34px; padding: 0 10px;">
              ${STRINGS.actions.copySummary}
            </button>
            <button class="btn btn-danger btn-xs" id="jour-delete-session-btn" style="min-height: 34px; padding: 0 10px;">
              Supprimer
            </button>
          </div>
        </div>

        <div>${tabsToggleHtml}</div>

        <!-- Carte de résumé -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary);">
              Résumé de la séance
            </span>
            <span style="font-size: var(--font-size-xl); font-weight: 800; color: var(--accent-active);">
              ${summary.total} élève(s)
            </span>
          </div>

          <div style="display: flex; gap: 16px; font-size: var(--font-size-sm); color: var(--text-secondary); flex-wrap: wrap;">
            <div>Filles : <strong style="color: #db2777;">${summary.girls}</strong></div>
            <div>Garçons : <strong style="color: #0284c7;">${summary.boys}</strong></div>
            <div>Internes : <strong style="color: #10b981;">${summary.internals}</strong></div>
          </div>

          ${Object.keys(summary.byYear).length > 0 ? `
            <table class="data-table" style="margin-top: 6px;">
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Filles</th>
                  <th>Garçons</th>
                  <th>Internes</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${yearRowsHtml}
              </tbody>
            </table>
          ` : '<p style="font-size: 0.85rem; color: var(--text-muted);">Aucune répartition disponible.</p>'}
        </div>

        <!-- Liste des élèves présent(e)s -->
        <div>
          <h3 style="margin-bottom: 6px; font-size: var(--font-size-base);">${STRINGS.nav.jour} (${presentList.length})</h3>
          <p style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 6px;">${STRINGS.stats.longPressHint}</p>

          ${presentList.length === 0 ? `
            <div style="text-align: center; padding: 20px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              ${STRINGS.stats.noAttendanceToday}
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${presentList
                .map(
                  (item) => `
                <div class="student-card-compact" data-student-id="${item.student.id}" data-event-id="${item.attendance.eventId}" data-attendance-id="${item.attendance.id}">
                  <div class="student-info-inline">
                    <span class="student-name-compact">${this.escapeHtml(item.student.firstName)} ${this.escapeHtml(item.student.lastName)}</span>
                    <span class="badge-year-compact">${this.escapeHtml(extractYearLevel(item.student.year))}</span>
                    <span class="badge-gender-compact ${item.student.gender}">${item.student.gender === 'F' ? 'F' : 'G'}</span>
                    ${item.student.isInternal ? `<span class="badge-internal-compact">Int.</span>` : ''}
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: var(--font-size-xs); color: var(--text-muted); font-weight: 500;">
                      ${formatTimeBrussels(item.attendance.markedAt)}
                    </span>
                    <button class="btn btn-danger btn-xs jour-cancel-btn" style="min-height: 28px; padding: 0 8px; font-size: 0.72rem;" title="Annuler ce pointage">
                      Annuler
                    </button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `}
        </div>
      </div>

      <div id="jour-modal-container"></div>
    `;

    this.attachEvents(summary, eventTitle, sortedForSummary);
  }

  private openEditSessionModal(eventTitle: string): void {
    const modalContainer = this.container.querySelector('#jour-modal-container');
    if (!modalContainer) return;

    let selectedType: 'presence' | 'course' = this.activeTab;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="jour-edit-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Modifier les informations de la séance
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="jour-edit-modal-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="jour-edit-session-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Titre de la séance *
              </label>
              <input type="text" id="jour-edit-title" class="search-input" value="${this.escapeHtml(this.currentEvent?.title || eventTitle)}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Date de la séance *
              </label>
              <input type="date" id="jour-edit-date" class="search-input" value="${this.options.date}" style="min-height: 38px; padding: 4px 8px;" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Type de séance
              </label>
              <div id="jour-edit-type-toggle">
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
              <textarea id="jour-edit-desc" class="search-input" style="min-height: 70px; resize: vertical;">${this.escapeHtml(this.currentEvent?.description || '')}</textarea>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary" id="jour-edit-cancel-btn" style="flex: 1; min-height: 40px;">
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

    const overlay = modalContainer.querySelector('#jour-edit-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
      });
    }

    const closeBtn = modalContainer.querySelector('#jour-edit-modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    const cancelBtn = modalContainer.querySelector('#jour-edit-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);

    const typeToggleContainer = modalContainer.querySelector('#jour-edit-type-toggle') as HTMLElement;
    if (typeToggleContainer) {
      setupSegmentedToggleEvents(typeToggleContainer, (val) => {
        selectedType = val as 'presence' | 'course';
      });
    }

    const form = modalContainer.querySelector<HTMLFormElement>('#jour-edit-session-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titleInput = modalContainer.querySelector<HTMLInputElement>('#jour-edit-title');
        const dateInput = modalContainer.querySelector<HTMLInputElement>('#jour-edit-date');
        const descInput = modalContainer.querySelector<HTMLTextAreaElement>('#jour-edit-desc');

        const newTitle = titleInput?.value.trim() || 'Séance';
        const newDate = dateInput?.value.trim() || this.options.date;
        const newDesc = descInput?.value.trim() || '';

        const origEventId = this.currentEvent?.id;
        const origDate = this.options.date;
        const origType = this.activeTab;

        if (origEventId) {
          const updated = await updateEvent(origEventId, {
            title: newTitle,
            date: newDate,
            type: selectedType,
            description: newDesc,
          });
          if (updated) {
            this.currentEvent = updated;
          }

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

          this.currentEvent = newEvent;
          this.options.eventId = newEvent.id;

          await db.attendances.where('[date+type]').equals([origDate, origType]).modify({
            eventId: newEvent.id,
            date: newDate,
            type: selectedType,
            dirty: 1,
            updatedAt: Date.now(),
          });
        }

        showToast('Séance mise à jour !');
        this.options.date = newDate;
        this.activeTab = selectedType;
        if (this.currentEvent) {
          this.options.eventId = this.currentEvent.id;
        }
        closeOverlay();
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private attachEvents(
    summary: ReturnType<typeof calculateDaySummary>,
    eventTitle: string,
    sortedPresentList: Array<{ student: StudentRecord; attendance: any }>
  ): void {
    const resumeBtn = this.container.querySelector('#jour-resume-pointage-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        if (this.options.onResumePointage) {
          this.options.onResumePointage(this.currentEvent?.id, this.options.date, this.activeTab);
        }
      });
    }

    const editInfoBtn = this.container.querySelector('#jour-edit-info-btn');
    if (editInfoBtn) {
      editInfoBtn.addEventListener('click', () => {
        this.openEditSessionModal(eventTitle);
      });
    }

    setupSegmentedToggleEvents(this.container, (val) => {
      this.activeTab = val as 'presence' | 'course';
      this.options.eventId = undefined;
      this.loadDataAndRender();
    });

    const copyBtn = this.container.querySelector('#jour-copy-summary-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = generateAttendanceSummaryText({
          title: eventTitle,
          description: this.currentEvent?.description,
          date: this.options.date,
          summary,
          students: sortedPresentList.map((item) => item.student),
        });

        navigator.clipboard.writeText(text);
        showToast(STRINGS.actions.copiedSuccess);
      });
    }

    const deleteBtn = this.container.querySelector('#jour-delete-session-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const attendeeCount = sortedPresentList.length;
        let confirmMsg = `Êtes-vous sûr de vouloir supprimer cette entrée du ${formatReadableDate(this.options.date)} ?`;
        if (attendeeCount > 0) {
          confirmMsg = `Attention : cette séance contient ${attendeeCount} élève(s) pointé(s).\n\nÊtes-vous sûr de vouloir supprimer définitivement cette entrée ainsi que tous ses pointages associés ?`;
        }
        if (confirm(confirmMsg)) {
          if (this.currentEvent) {
            await deleteEvent(this.currentEvent.id);
          } else {
            const atts = await getAttendancesByDateAndType(this.options.date, this.activeTab);
            for (const a of atts) {
              await db.attendances.delete(a.id);
            }
          }
          showToast('Entrée supprimée avec succès.');
          this.options.onRefreshNeeded();
          if (this.options.onDeleteSession) {
            this.options.onDeleteSession();
          }
        }
      });
    }

    // Appui pour ouvrir la fiche ou annuler
    const cards = this.container.querySelectorAll<HTMLElement>('.student-card-compact');
    cards.forEach((card) => {
      const studentId = card.dataset.studentId;
      const eventId = card.dataset.eventId || (this.currentEvent ? this.currentEvent.id : `${this.options.date}_${this.activeTab}`);
      if (!studentId) return;

      const cancelBtn = card.querySelector('.jour-cancel-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await toggleAttendance(eventId, studentId, this.options.date, this.activeTab, false);
          showToast('Pointage annulé');
          this.loadDataAndRender();
          this.options.onRefreshNeeded();
        });
      }

      card.addEventListener('click', () => {
        this.options.onStudentCardClick(studentId);
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
