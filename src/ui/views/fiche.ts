import { STRINGS } from '../strings';
import { showToast } from '../components/toast';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import {
  getStudentById,
  updateStudent,
  deleteStudentPermanently,
  checkProbableDuplicate,
  type StudentRecord,
} from '../../db/students';
import { getYearsList, addYearIfMissing } from '../../db/meta';
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
      <div style="padding: 12px 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-xs" id="fiche-back-btn" style="min-height: 34px; padding: 0 12px;">
            ← Retour
          </button>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-xs" id="fiche-edit-student-btn" style="min-height: 34px; padding: 0 12px; font-weight: 700;">
              ✏️ Modifier les infos
            </button>
            <button class="btn btn-secondary btn-xs" id="fiche-toggle-active-btn" style="min-height: 34px; padding: 0 10px;">
              ${student.active ? 'Désactiver' : 'Réactiver'}
            </button>
            <button class="btn btn-danger btn-xs" id="fiche-delete-btn" style="min-height: 34px; padding: 0 10px;">
              Supprimer
            </button>
          </div>
        </div>

        <!-- En-tête Identité -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 14px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="font-size: 1.3rem; font-weight: 800;">
                ${this.escapeHtml(student.firstName)} ${this.escapeHtml(student.lastName)}
              </h2>
              <div style="display: flex; gap: 6px; margin-top: 6px; align-items: center; flex-wrap: wrap;">
                <span class="badge-year-compact" style="font-size: 0.8rem; padding: 2px 8px;">${this.escapeHtml(student.year)}</span>
                <span class="badge-gender-compact ${student.gender}" style="font-size: 0.8rem; padding: 2px 8px;">${student.gender === 'F' ? 'Fille' : 'Garçon'}</span>
                ${student.isInternal ? `<span class="badge-internal-compact" style="font-size: 0.75rem; padding: 2px 6px;">Interne</span>` : ''}
                <span style="font-size: var(--font-size-xs); font-weight: 700; color: ${student.active ? 'var(--color-success)' : 'var(--color-danger)'}">
                  ${student.active ? '• Actif' : '• Inactif'}
                </span>
              </div>
              ${student.notes ? `
                <div style="margin-top: 8px; font-size: var(--font-size-sm); color: var(--text-secondary); background: var(--bg-surface-hover); padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  Note : ${this.escapeHtml(student.notes)}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Grille des compteurs -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; text-align: center;">
            <div style="background: var(--accent-presence-light); padding: 8px 4px; border-radius: var(--radius-md);">
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-presence);">${presencesCount}</div>
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-presence);">${STRINGS.types.presence}s</div>
            </div>

            <div style="background: var(--accent-course-light); padding: 8px 4px; border-radius: var(--radius-md);">
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-course);">${coursesCount}</div>
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-course);">${STRINGS.types.course}s</div>
            </div>

            <div style="background: var(--bg-surface-hover); padding: 8px 4px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${presencesCount + coursesCount}</div>
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-secondary);">${STRINGS.stats.total}</div>
            </div>
          </div>

          <div style="margin-top: 10px; font-size: 0.75rem; color: var(--text-muted); text-align: center;">
            ${STRINGS.student.lastSeen} : <strong>${lastSeen ? formatReadableDate(lastSeen) : STRINGS.student.never}</strong>
          </div>
        </div>

        <!-- Historique chronologique -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <h3 style="font-size: var(--font-size-base); font-weight: 700;">${STRINGS.nav.historique} (${filteredList.length})</h3>
            <select id="fiche-type-filter" class="search-input-compact" style="width: auto; height: 30px; padding: 0 6px; font-size: 0.75rem;">
              <option value="all" ${this.typeFilter === 'all' ? 'selected' : ''}>Tous les types</option>
              <option value="presence" ${this.typeFilter === 'presence' ? 'selected' : ''}>Entraînements</option>
              <option value="course" ${this.typeFilter === 'course' ? 'selected' : ''}>Courses</option>
            </select>
          </div>

          ${filteredList.length === 0 ? `
            <div style="text-align: center; padding: 20px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 0.85rem;">
              Aucun pointage enregistré pour cet élève.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${filteredList.map((att) => {
                const isPresence = att.type === 'presence';
                const badgeColor = isPresence ? 'var(--accent-presence)' : 'var(--accent-course)';
                const badgeBg = isPresence ? 'var(--accent-presence-light)' : 'var(--accent-course-light)';
                const event = att.eventId ? eventsMap.get(att.eventId) : primaryEventByDateAndType.get(`${att.date}_${att.type}`);
                const title = event ? event.title : (isPresence ? STRINGS.types.presence : STRINGS.types.course);

                return `
                  <div class="fiche-session-card" data-date="${att.date}" data-type="${att.type}" data-event-id="${att.eventId || ''}" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 8px;">
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${this.escapeHtml(title)}</div>
                      ${event?.description ? `
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${this.escapeHtml(event.description)}
                        </div>
                      ` : ''}
                      <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 1px;">
                        ${formatReadableDate(att.date)} • ${formatTimeBrussels(att.markedAt)}
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                      <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;">
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

      <div id="fiche-modal-container"></div>
    `;

    this.attachEvents();
  }

  private async openEditStudentModal(): Promise<void> {
    if (!this.student) return;
    const modalContainer = this.container.querySelector('#fiche-modal-container');
    if (!modalContainer) return;

    const student = this.student;
    const yearsList = await getYearsList();
    let selectedGender: 'F' | 'M' = student.gender;
    let isCustomClassMode = false;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="fiche-edit-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Modifier l'élève
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="fiche-modal-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="fiche-student-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div id="fiche-duplicate-warning-banner" class="past-date-banner" style="display: none;">
              ${STRINGS.student.duplicateWarning}
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.firstName} *
              </label>
              <input type="text" id="fiche-form-first-name" class="search-input" value="${this.escapeHtml(student.firstName)}" placeholder="ex: Lucas" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.lastName} *
              </label>
              <input type="text" id="fiche-form-last-name" class="search-input" value="${this.escapeHtml(student.lastName)}" placeholder="ex: Dubois" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.gender} *
              </label>
              <div id="fiche-form-gender-toggle">
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
                <button type="button" id="fiche-toggle-new-class-btn" style="background: none; border: none; font-size: 0.75rem; color: var(--accent-active); font-weight: 700; cursor: pointer; text-decoration: underline;">
                  + Créer une nouvelle classe
                </button>
              </div>
              <select id="fiche-form-year-select" class="search-input" style="appearance: auto;">
                ${yearsList
                  .map(
                    (yr) => `
                  <option value="${yr}" ${student.year === yr ? 'selected' : ''}>${yr}</option>
                `
                  )
                  .join('')}
                <option value="__new__">+ Autre classe...</option>
              </select>
              <div id="fiche-custom-class-container" style="display: none; margin-top: 6px;">
                <input type="text" id="fiche-custom-class-input" class="search-input" placeholder="Nom de la nouvelle classe (ex: 3C, 6G, Term 2...)" />
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="fiche-form-internal-checkbox" ${student.isInternal ? 'checked' : ''} />
              <label for="fiche-form-internal-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                Élève Interne (EstInterne)
              </label>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.notes}
              </label>
              <textarea id="fiche-form-notes" class="search-input" style="min-height: 60px; resize: vertical;">${this.escapeHtml(student.notes || '')}</textarea>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="fiche-form-active-checkbox" ${student.active ? 'checked' : ''} />
              <label for="fiche-form-active-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                ${STRINGS.student.active}
              </label>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary" id="fiche-form-cancel-btn" style="flex: 1; min-height: 40px;">
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

    const overlay = modalContainer.querySelector('#fiche-edit-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
      });
    }

    const closeBtn = modalContainer.querySelector('#fiche-modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    const cancelBtn = modalContainer.querySelector('#fiche-form-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);

    const genderContainer = modalContainer.querySelector('#fiche-form-gender-toggle') as HTMLElement;
    if (genderContainer) {
      setupSegmentedToggleEvents(genderContainer, (val) => {
        selectedGender = val as 'F' | 'M';
      });
    }

    const firstNameInput = modalContainer.querySelector<HTMLInputElement>('#fiche-form-first-name');
    const lastNameInput = modalContainer.querySelector<HTMLInputElement>('#fiche-form-last-name');
    const yearSelect = modalContainer.querySelector<HTMLSelectElement>('#fiche-form-year-select');
    const customClassContainer = modalContainer.querySelector<HTMLElement>('#fiche-custom-class-container');
    const customClassInput = modalContainer.querySelector<HTMLInputElement>('#fiche-custom-class-input');
    const toggleNewClassBtn = modalContainer.querySelector('#fiche-toggle-new-class-btn');
    const warningBanner = modalContainer.querySelector<HTMLElement>('#fiche-duplicate-warning-banner');

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

    const form = modalContainer.querySelector<HTMLFormElement>('#fiche-student-form');
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

        const isInternal = modalContainer.querySelector<HTMLInputElement>('#fiche-form-internal-checkbox')?.checked ?? false;
        const notes = (modalContainer.querySelector<HTMLTextAreaElement>('#fiche-form-notes')?.value || '').trim();
        const active = modalContainer.querySelector<HTMLInputElement>('#fiche-form-active-checkbox')?.checked ?? true;

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

  private attachEvents(): void {
    const backBtn = this.container.querySelector('#fiche-back-btn');
    if (backBtn) backBtn.addEventListener('click', this.options.onBack);

    const editBtn = this.container.querySelector('#fiche-edit-student-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.openEditStudentModal();
      });
    }

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
