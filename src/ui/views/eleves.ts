import { STRINGS } from '../strings';
import { renderAZBar, setupAZBarEvents } from '../components/az-bar';
import { renderYearChips, setupYearChipsEvents } from '../components/chips';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { showToast } from '../components/toast';
import {
  getFilteredStudents,
  createStudent,
  updateStudent,
  checkProbableDuplicate,
  getStudentById,
  type StudentRecord,
} from '../../db/students';
import { getYearsList, addYearIfMissing } from '../../db/meta';
import { normalizeText } from '../../domain/normalize';

export interface ElevesViewOptions {
  onStudentCardClick: (studentId: string) => void;
  onRefreshNeeded: () => void;
}

export class ElevesView {
  private container: HTMLElement;
  private options: ElevesViewOptions;

  private searchQuery = '';
  private selectedYears: string[] = ['all'];
  private selectedLetter = 'ALL';
  private showInactive = false;

  private students: StudentRecord[] = [];
  private yearsList: string[] = [];

  constructor(container: HTMLElement, options: ElevesViewOptions) {
    this.container = container;
    this.options = options;
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    this.yearsList = await getYearsList();

    const allStudentsForLetters = await getFilteredStudents({
      onlyActive: !this.showInactive,
    });

    const availableLetters = new Set<string>();
    for (const s of allStudentsForLetters) {
      const fnNorm = normalizeText(s.firstName);
      if (fnNorm.length > 0) {
        availableLetters.add(fnNorm.charAt(0).toUpperCase());
      }
    }

    this.students = await getFilteredStudents({
      query: this.searchQuery,
      years: this.selectedYears,
      initialLetter: this.selectedLetter,
      onlyActive: !this.showInactive,
    });

    this.container.innerHTML = `
      <div style="padding: 12px 16px; position: relative; min-height: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h2>${STRINGS.nav.eleves} (${this.students.length})</h2>
          <button class="btn btn-primary" id="eleves-add-btn">
            + ${STRINGS.actions.addStudent}
          </button>
        </div>

        <div class="filter-section">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="text" id="eleves-search" class="search-input" placeholder="${STRINGS.header.searchPlaceholder}" value="${this.escapeHtml(this.searchQuery)}" />
            ${this.searchQuery ? `<button class="clear-search-btn" id="eleves-clear-search">✕</button>` : ''}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
            <div>${renderYearChips(this.yearsList, this.selectedYears)}</div>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;">
              <input type="checkbox" id="eleves-show-inactive" ${this.showInactive ? 'checked' : ''} />
              ${STRINGS.header.includeInactive}
            </label>
          </div>

          <div>${renderAZBar(availableLetters, this.selectedLetter)}</div>
        </div>

        <div class="student-list" style="margin-top: 12px; padding: 0;">
          ${this.students.length === 0 ? `
            <div style="text-align: center; padding: 32px; color: var(--text-muted);">
              Aucun élève trouvé.
            </div>
          ` : this.students.map((student) => `
            <div class="student-card" data-student-id="${student.id}">
              <div class="student-info">
                <div class="student-name" style="${!student.active ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                  ${this.escapeHtml(student.firstName)} ${this.escapeHtml(student.lastName)}
                  ${!student.active ? ' <span style="font-size: 0.75rem; color: var(--color-danger);">(Inactif)</span>' : ''}
                </div>
                <div class="student-meta">
                  <span class="badge-year">${this.escapeHtml(student.year)}</span>
                  <span class="badge-gender ${student.gender}">${student.gender === 'F' ? 'Fille' : 'Garçon'}</span>
                  ${student.notes ? `<span style="color: var(--text-muted); font-size: 0.75rem;">📝 ${this.escapeHtml(student.notes)}</span>` : ''}
                </div>
              </div>
              <button class="btn btn-secondary eleves-edit-btn" data-student-id="${student.id}" style="min-height: 38px; padding: 0 10px; font-size: 0.8rem;">
                ${STRINGS.actions.edit}
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Zone Modale Formulaire -->
      <div id="eleves-modal-container"></div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const searchInput = this.container.querySelector<HTMLInputElement>('#eleves-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchQuery = searchInput.value;
        this.loadDataAndRender();
      });
    }

    const clearBtn = this.container.querySelector('#eleves-clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.loadDataAndRender();
      });
    }

    const inactiveCheckbox = this.container.querySelector<HTMLInputElement>('#eleves-show-inactive');
    if (inactiveCheckbox) {
      inactiveCheckbox.addEventListener('change', () => {
        this.showInactive = inactiveCheckbox.checked;
        this.loadDataAndRender();
      });
    }

    setupYearChipsEvents(this.container, this.selectedYears, (years) => {
      this.selectedYears = years;
      this.loadDataAndRender();
    });

    setupAZBarEvents(this.container, (letter) => {
      this.selectedLetter = letter;
      this.loadDataAndRender();
    });

    const addBtn = this.container.querySelector('#eleves-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openStudentModal();
      });
    }

    const editBtns = this.container.querySelectorAll<HTMLButtonElement>('.eleves-edit-btn');
    editBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.studentId;
        if (id) {
          const student = await getStudentById(id);
          if (student) {
            this.openStudentModal(student);
          }
        }
      });
    });

    const cards = this.container.querySelectorAll<HTMLElement>('.student-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.studentId;
        if (id) {
          this.options.onStudentCardClick(id);
        }
      });
    });
  }

  private async openStudentModal(student?: StudentRecord): Promise<void> {
    const isEdit = Boolean(student);
    const modalContainer = this.container.querySelector('#eleves-modal-container');
    if (!modalContainer) return;

    let selectedGender: 'F' | 'M' = student ? student.gender : 'F';

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="eleves-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              ${isEdit ? STRINGS.actions.edit : STRINGS.actions.addStudent}
            </h3>
            <button class="btn btn-secondary" id="modal-close-btn" style="min-height: 36px; padding: 0 10px;">✕</button>
          </div>

          <form id="student-form" style="display: flex; flex-direction: column; gap: 14px;">
            <div id="duplicate-warning-banner" class="past-date-banner" style="display: none;">
              ${STRINGS.student.duplicateWarning}
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.firstName} *
              </label>
              <input type="text" id="form-first-name" class="search-input" value="${student ? this.escapeHtml(student.firstName) : ''}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.lastName} *
              </label>
              <input type="text" id="form-last-name" class="search-input" value="${student ? this.escapeHtml(student.lastName) : ''}" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.gender} *
              </label>
              <div id="form-gender-toggle">
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
              <select id="form-year-select" class="search-input" style="appearance: auto;">
                ${this.yearsList
                  .map(
                    (yr) => `
                  <option value="${yr}" ${student && student.year === yr ? 'selected' : ''}>${yr}</option>
                `
                  )
                  .join('')}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.notes}
              </label>
              <textarea id="form-notes" class="search-input" style="min-height: 70px; resize: vertical;">${student ? this.escapeHtml(student.notes) : ''}</textarea>
            </div>

            ${isEdit ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="form-active-checkbox" ${student?.active ? 'checked' : ''} />
                <label for="form-active-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                  ${STRINGS.student.active}
                </label>
              </div>
            ` : ''}

            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button type="button" class="btn btn-secondary" id="form-cancel-btn" style="flex: 1;">
                ${STRINGS.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1;">
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

    const overlay = modalContainer.querySelector('#eleves-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
      });
    }

    const closeBtn = modalContainer.querySelector('#modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    const cancelBtn = modalContainer.querySelector('#form-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);

    const genderContainer = modalContainer.querySelector('#form-gender-toggle') as HTMLElement;
    if (genderContainer) {
      setupSegmentedToggleEvents(genderContainer, (val) => {
        selectedGender = val as 'F' | 'M';
      });
    }

    // Détection en direct des doublons probables
    const firstNameInput = modalContainer.querySelector<HTMLInputElement>('#form-first-name');
    const lastNameInput = modalContainer.querySelector<HTMLInputElement>('#form-last-name');
    const yearSelect = modalContainer.querySelector<HTMLSelectElement>('#form-year-select');
    const warningBanner = modalContainer.querySelector<HTMLElement>('#duplicate-warning-banner');

    const checkDuplicates = async () => {
      if (!firstNameInput || !lastNameInput || !yearSelect || !warningBanner) return;
      const fn = firstNameInput.value;
      const ln = lastNameInput.value;
      const yr = yearSelect.value;
      if (fn.trim() && ln.trim()) {
        const isDup = await checkProbableDuplicate(fn, ln, yr, student?.id);
        warningBanner.style.display = isDup ? 'block' : 'none';
      }
    };

    if (firstNameInput) firstNameInput.addEventListener('input', checkDuplicates);
    if (lastNameInput) lastNameInput.addEventListener('input', checkDuplicates);
    if (yearSelect) yearSelect.addEventListener('change', checkDuplicates);

    // Enregistrement
    const form = modalContainer.querySelector<HTMLFormElement>('#student-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!firstNameInput || !lastNameInput || !yearSelect) return;

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const year = yearSelect.value.trim();
        const notes = (modalContainer.querySelector<HTMLTextAreaElement>('#form-notes')?.value || '').trim();
        const active = isEdit
          ? modalContainer.querySelector<HTMLInputElement>('#form-active-checkbox')?.checked ?? true
          : true;

        if (!firstName || !lastName || !year) {
          showToast('Veuillez remplir les champs obligatoires.');
          return;
        }

        await addYearIfMissing(year);

        if (isEdit && student) {
          await updateStudent({
            id: student.id,
            firstName,
            lastName,
            gender: selectedGender,
            year,
            notes,
            active,
          });
          showToast('Élève mis à jour.');
        } else {
          await createStudent({
            firstName,
            lastName,
            gender: selectedGender,
            year,
            notes,
            active: true,
          });
          showToast('Élève créé.');
        }

        closeOverlay();
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
