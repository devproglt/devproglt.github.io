import { STRINGS } from '../strings';
import { renderYearChips, setupYearChipsEvents } from '../components/chips';
import { renderAZBar, setupAZBarEvents, computeAvailableLetters, updateAZBarAvailability } from '../components/az-bar';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { showToast } from '../components/toast';
import { openImportMappingModal } from '../components/import-modal';
import {
  getFilteredStudents,
  createStudent,
  updateStudent,
  deleteStudentPermanently,
  checkProbableDuplicate,
  getStudentById,
  type StudentRecord,
} from '../../db/students';
import { getYearsList, addYearIfMissing } from '../../db/meta';

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
  private allStudents: StudentRecord[] = [];
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

    this.allStudents = await getFilteredStudents({
      onlyActive: !this.showInactive,
    });

    this.students = await getFilteredStudents({
      query: this.searchQuery,
      years: this.selectedYears,
      onlyActive: !this.showInactive,
      initialLetter: this.selectedLetter,
    });

    const availableLetters = computeAvailableLetters(
      this.selectedYears.includes('all')
        ? this.allStudents
        : this.allStudents.filter((s) => {
            const yr = s.year.trim();
            return this.selectedYears.some((lvl) => yr === lvl || yr.startsWith(lvl));
          })
    );

    this.container.innerHTML = `
      <div style="padding: 8px 14px; position: relative; min-height: 100%; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
          <h2 id="eleves-title" style="font-size: 1.15rem; font-weight: 800;">${STRINGS.nav.eleves} (${this.students.length})</h2>
          <div style="display: flex; gap: 6px; align-items: center;">
            <label class="btn btn-secondary btn-xs" style="cursor: pointer;">
              📂 Importer Excel
              <input type="file" id="eleves-import-file" accept=".xlsx, .xls, .csv" style="display: none;" />
            </label>
            <button class="btn btn-primary btn-xs" id="eleves-add-btn">
              + ${STRINGS.actions.add}
            </button>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-row-compact">
            <div class="search-bar-compact">
              <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></svg>
              <input type="search" id="eleves-search" class="search-input-compact" placeholder="Recherche..." value="${this.escapeHtml(this.searchQuery)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
              <button type="button" class="clear-search-btn-compact" id="eleves-clear-search" style="display: ${this.searchQuery ? 'flex' : 'none'};">✕</button>
            </div>

            <div id="eleves-year-chips" class="chips-container-compact">${renderYearChips(this.yearsList, this.selectedYears)}</div>

            <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; cursor: pointer; white-space: nowrap; margin-left: 2px;">
              <input type="checkbox" id="eleves-show-inactive" ${this.showInactive ? 'checked' : ''} />
              <span>Inactifs</span>
            </label>
          </div>

          <div id="eleves-az-bar">${renderAZBar(availableLetters, this.selectedLetter)}</div>
        </div>

        <div class="student-list" id="eleves-student-list" style="padding: 0;">
          ${this.renderStudentListHtml()}
        </div>
      </div>

      <div id="eleves-modal-container"></div>
    `;

    this.attachEvents();
  }

  private renderStudentListHtml(): string {
    if (this.students.length === 0) {
      return `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
          Aucun élève trouvé.
        </div>
      `;
    }

    return this.students
      .map(
        (student) => `
      <div class="student-card-compact" data-student-id="${student.id}">
        <div class="student-info-inline">
          <span class="student-name-compact" style="${!student.active ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
            ${this.escapeHtml(student.firstName)} ${this.escapeHtml(student.lastName)}
            ${!student.active ? ' <span style="font-size: 0.7rem; color: var(--color-danger);">(Inactif)</span>' : ''}
          </span>
          <span class="badge-year-compact">${this.escapeHtml(student.year)}</span>
          <span class="badge-gender-compact ${student.gender}">${student.gender === 'F' ? 'F' : 'G'}</span>
          ${student.isInternal ? `<span class="badge-internal-compact">Int.</span>` : ''}
        </div>
        <button class="btn btn-secondary btn-xs eleves-edit-btn" data-student-id="${student.id}" style="min-height: 28px; padding: 0 8px; font-size: 0.75rem;">
          ${STRINGS.actions.edit}
        </button>
      </div>
    `
      )
      .join('');
  }

  private async updateFilteredListOnly(): Promise<void> {
    this.allStudents = await getFilteredStudents({
      onlyActive: !this.showInactive,
    });

    this.students = await getFilteredStudents({
      query: this.searchQuery,
      years: this.selectedYears,
      onlyActive: !this.showInactive,
      initialLetter: this.selectedLetter,
    });

    const listContainer = this.container.querySelector('#eleves-student-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderStudentListHtml();
      this.attachCardEventsOnly();
    }

    const titleEl = this.container.querySelector('#eleves-title');
    if (titleEl) {
      titleEl.textContent = `${STRINGS.nav.eleves} (${this.students.length})`;
    }

    const clearBtn = this.container.querySelector<HTMLElement>('#eleves-clear-search');
    if (clearBtn) {
      clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
    }

    const availableLetters = computeAvailableLetters(
      this.selectedYears.includes('all')
        ? this.allStudents
        : this.allStudents.filter((s) => {
            const yr = s.year.trim();
            return this.selectedYears.some((lvl) => yr === lvl || yr.startsWith(lvl));
          })
    );
    updateAZBarAvailability(this.container, availableLetters, this.selectedLetter);
  }

  private attachCardEventsOnly(): void {
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

    const cards = this.container.querySelectorAll<HTMLElement>('.student-card-compact');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.studentId;
        if (id) {
          this.options.onStudentCardClick(id);
        }
      });
    });
  }

  private attachEvents(): void {
    const searchInput = this.container.querySelector<HTMLInputElement>('#eleves-search');
    if (searchInput) {
      const onSearchUpdate = () => {
        this.searchQuery = searchInput.value;
        this.updateFilteredListOnly();
      };
      searchInput.addEventListener('input', onSearchUpdate);
      searchInput.addEventListener('keyup', onSearchUpdate);
      searchInput.addEventListener('search', onSearchUpdate);
    }

    const clearBtn = this.container.querySelector('#eleves-clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.searchQuery = '';
        if (searchInput) searchInput.value = '';
        this.updateFilteredListOnly();
      });
    }

    const inactiveCheckbox = this.container.querySelector<HTMLInputElement>('#eleves-show-inactive');
    if (inactiveCheckbox) {
      inactiveCheckbox.addEventListener('change', () => {
        this.showInactive = inactiveCheckbox.checked;
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

    const addBtn = this.container.querySelector('#eleves-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openStudentModal();
      });
    }

    const importFileInput = this.container.querySelector<HTMLInputElement>('#eleves-import-file');
    if (importFileInput) {
      importFileInput.addEventListener('change', () => {
        const file = importFileInput.files?.[0];
        if (!file) return;

        openImportMappingModal({
          file,
          onSuccess: async () => {
            this.searchQuery = '';
            this.selectedYears = ['all'];
            this.selectedLetter = 'ALL';
            await this.loadDataAndRender();
            this.options.onRefreshNeeded();
          },
          onClose: () => {
            importFileInput.value = '';
          },
        });
      });
    }

    this.attachCardEventsOnly();
  }

  private async openStudentModal(student?: StudentRecord): Promise<void> {
    const isEdit = Boolean(student);
    const modalContainer = this.container.querySelector('#eleves-modal-container');
    if (!modalContainer) return;

    let selectedGender: 'F' | 'M' = student ? student.gender : 'F';
    let isCustomClassMode = false;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="eleves-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              ${isEdit ? STRINGS.actions.edit : STRINGS.actions.addStudent}
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="modal-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="student-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div id="duplicate-warning-banner" class="past-date-banner" style="display: none;">
              ${STRINGS.student.duplicateWarning}
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.firstName} *
              </label>
              <input type="text" id="form-first-name" class="search-input" value="${student ? this.escapeHtml(student.firstName) : ''}" placeholder="ex: Lucas" required />
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.lastName} *
              </label>
              <input type="text" id="form-last-name" class="search-input" value="${student ? this.escapeHtml(student.lastName) : ''}" placeholder="ex: Dubois" required />
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
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: var(--font-size-xs); font-weight: 600;">
                  ${STRINGS.student.year} *
                </label>
                <button type="button" id="eleves-toggle-new-class-btn" style="background: none; border: none; font-size: 0.75rem; color: var(--accent-active); font-weight: 700; cursor: pointer; text-decoration: underline;">
                  + Créer une nouvelle classe
                </button>
              </div>
              <select id="form-year-select" class="search-input" style="appearance: auto;">
                ${this.yearsList
                  .map(
                    (yr) => `
                  <option value="${yr}" ${student && student.year === yr ? 'selected' : ''}>${yr}</option>
                `
                  )
                  .join('')}
                <option value="__new__">+ Autre classe...</option>
              </select>
              <div id="eleves-custom-class-container" style="display: none; margin-top: 6px;">
                <input type="text" id="eleves-custom-class-input" class="search-input" placeholder="Nom de la nouvelle classe (ex: 3C, 6G, Term 2...)" />
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="form-internal-checkbox" ${student?.isInternal ? 'checked' : ''} />
              <label for="form-internal-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                Élève Interne (EstInterne)
              </label>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.student.notes}
              </label>
              <textarea id="form-notes" class="search-input" style="min-height: 60px; resize: vertical;">${student ? this.escapeHtml(student.notes) : ''}</textarea>
            </div>

            ${isEdit ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="form-active-checkbox" ${student?.active ? 'checked' : ''} />
                <label for="form-active-checkbox" style="font-size: var(--font-size-sm); font-weight: 600;">
                  ${STRINGS.student.active}
                </label>
              </div>
            ` : ''}

            <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
              ${isEdit ? `
                <button type="button" class="btn btn-danger btn-xs" id="form-delete-student-btn" style="flex: 1; min-height: 40px;">
                  Supprimer
                </button>
              ` : ''}
              <button type="button" class="btn btn-secondary" id="form-cancel-btn" style="flex: 1; min-height: 40px;">
                ${STRINGS.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1.4; min-height: 40px; font-weight: 700;">
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

    const deleteBtn = modalContainer.querySelector('#form-delete-student-btn');
    if (deleteBtn && student) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'élève ${student.firstName} ${student.lastName} ainsi que tous ses pointages ?`)) {
          await deleteStudentPermanently(student.id);
          showToast(`Élève ${student.firstName} ${student.lastName} supprimé.`);
          closeOverlay();
          await this.loadDataAndRender();
          this.options.onRefreshNeeded();
        }
      });
    }

    const genderContainer = modalContainer.querySelector('#form-gender-toggle') as HTMLElement;
    if (genderContainer) {
      setupSegmentedToggleEvents(genderContainer, (val) => {
        selectedGender = val as 'F' | 'M';
      });
    }

    const firstNameInput = modalContainer.querySelector<HTMLInputElement>('#form-first-name');
    const lastNameInput = modalContainer.querySelector<HTMLInputElement>('#form-last-name');
    const yearSelect = modalContainer.querySelector<HTMLSelectElement>('#form-year-select');
    const customClassContainer = modalContainer.querySelector<HTMLElement>('#eleves-custom-class-container');
    const customClassInput = modalContainer.querySelector<HTMLInputElement>('#eleves-custom-class-input');
    const toggleNewClassBtn = modalContainer.querySelector('#eleves-toggle-new-class-btn');
    const warningBanner = modalContainer.querySelector<HTMLElement>('#duplicate-warning-banner');

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
        const isDup = await checkProbableDuplicate(fn, ln, yr, student?.id);
        warningBanner.style.display = isDup ? 'block' : 'none';
      }
    };

    if (firstNameInput) firstNameInput.addEventListener('input', checkDuplicates);
    if (lastNameInput) lastNameInput.addEventListener('input', checkDuplicates);
    if (yearSelect) yearSelect.addEventListener('change', checkDuplicates);
    if (customClassInput) customClassInput.addEventListener('input', checkDuplicates);

    const form = modalContainer.querySelector<HTMLFormElement>('#student-form');
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

        const isInternal = modalContainer.querySelector<HTMLInputElement>('#form-internal-checkbox')?.checked ?? false;
        const notes = (modalContainer.querySelector<HTMLTextAreaElement>('#form-notes')?.value || '').trim();
        const active = isEdit
          ? modalContainer.querySelector<HTMLInputElement>('#form-active-checkbox')?.checked ?? true
          : true;

        if (!firstName || !lastName || !year || year === '__new__') {
          showToast('Veuillez remplir les champs obligatoires.');
          return;
        }

        await addYearIfMissing(year);
        this.yearsList = await getYearsList();

        if (isEdit && student) {
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
          showToast('Élève mis à jour.');
        } else {
          await createStudent({
            firstName,
            lastName,
            gender: selectedGender,
            year,
            isInternal,
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
