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
  getAllStudents,
  type StudentRecord,
} from '../../db/students';
import { getYearsList, addYearIfMissing } from '../../db/meta';
import {
  getTextileTypes,
  createTextileType,
  updateTextileType,
  deleteTextileType,
  getAllTextileDistributions,
  toggleStudentTextile,
  batchDistributeTextiles,
  type TextileTypeRecord,
  type TextileDistributionRecord,
} from '../../db/textiles';
import { exportTextilesToExcel } from '../../io/export';
import { getTodayBrussels } from '../../domain/dates';
import { SyncEngine } from '../../sync/engine';

export interface ElevesViewOptions {
  onStudentCardClick: (studentId: string) => void;
  onRefreshNeeded: () => void;
}

export class ElevesView {
  private container: HTMLElement;
  private options: ElevesViewOptions;

  private activeSubTab: 'eleves' | 'textiles' = 'eleves';

  // Filtres liste élèves
  private searchQuery = '';
  private selectedYears: string[] = ['all'];
  private selectedLetter = 'ALL';
  private showInactive = false;

  // Filtres & état textiles
  private selectedTextileFilterId = 'all'; // 'all' ou textileTypeId
  private textileStatusFilter: 'all' | 'received' | 'not_received' = 'all';
  private selectedStudentIds: Set<string> = new Set();
  private textileTypes: TextileTypeRecord[] = [];
  private textileDistributions: TextileDistributionRecord[] = [];

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

    if (this.activeSubTab === 'textiles') {
      const [types, distributions] = await Promise.all([
        getTextileTypes(),
        getAllTextileDistributions(),
      ]);
      this.textileTypes = types;
      this.textileDistributions = distributions;
    }

    const availableLetters = computeAvailableLetters(
      this.selectedYears.includes('all')
        ? this.allStudents
        : this.allStudents.filter((s) => {
            const yr = s.year.trim();
            return this.selectedYears.some((lvl) => yr === lvl || yr.startsWith(lvl));
          })
    );

    const subTabToggleHtml = renderSegmentedToggle(
      [
        { value: 'eleves', label: '👥 ' + STRINGS.textiles.tabEleves },
        { value: 'textiles', label: '👕 ' + STRINGS.textiles.tabTextiles },
      ],
      this.activeSubTab
    );

    this.container.innerHTML = `
      <div style="padding: 8px 14px; position: relative; min-height: 100%; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
          <h2 id="eleves-title" style="font-size: 1.15rem; font-weight: 800;">
            ${this.activeSubTab === 'eleves' ? `${STRINGS.nav.eleves} (${this.students.length})` : STRINGS.textiles.title}
          </h2>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            ${this.activeSubTab === 'eleves' ? `
              <label class="btn btn-secondary btn-xs" style="cursor: pointer;">
                📂 Importer Excel
                <input type="file" id="eleves-import-file" accept=".xlsx, .xls, .csv" style="display: none;" />
              </label>
              <button class="btn btn-primary btn-xs" id="eleves-add-btn">
                + ${STRINGS.actions.add}
              </button>
            ` : `
              <button class="btn btn-secondary btn-xs" id="textiles-manage-btn" style="min-height: 32px; padding: 0 10px; font-size: 0.78rem;">
                ⚙️ ${STRINGS.textiles.manageTextiles}
              </button>
              <button class="btn btn-primary btn-xs" id="textiles-add-type-btn" style="min-height: 32px; padding: 0 10px; font-size: 0.78rem; font-weight: 700;">
                + ${STRINGS.textiles.createTextile}
              </button>
              ${this.textileTypes.length > 0 ? `
                <button class="btn btn-secondary btn-xs" id="textiles-export-btn" style="min-height: 32px; padding: 0 10px; font-size: 0.78rem;">
                  📊 Exporter (.xlsx)
                </button>
              ` : ''}
            `}
          </div>
        </div>

        <div id="eleves-subtab-toggle">${subTabToggleHtml}</div>

        ${this.activeSubTab === 'eleves' ? this.renderElevesViewHtml(availableLetters) : this.renderTextilesViewHtml()}
      </div>

      <div id="eleves-modal-container"></div>
    `;

    this.attachEvents();
  }

  private renderElevesViewHtml(availableLetters: Set<string>): string {
    return `
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
    `;
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

  private renderTextilesViewHtml(): string {
    if (this.textileTypes.length === 0) {
      return `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 36px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 10px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 3.2rem; line-height: 1;">👕</div>
          <h3 style="font-size: var(--font-size-lg); font-weight: 800; color: var(--text-primary);">
            ${STRINGS.textiles.noTextilesConfigured}
          </h3>
          <p style="font-size: var(--font-size-sm); color: var(--text-secondary); max-width: 440px;">
            Créez votre premier équipement (ex: <strong>T-shirt</strong>, <strong>Veste</strong>, <strong>Short</strong>) pour commencer à enregistrer qui a reçu quoi et quand.
          </p>
          <button class="btn btn-primary" id="textiles-create-first-btn" style="min-height: 42px; padding: 0 20px; font-weight: 700; font-size: 0.9rem;">
            + ${STRINGS.textiles.createTextile}
          </button>
        </div>
      `;
    }

    const distMap = new Map<string, TextileDistributionRecord>();
    for (const d of this.textileDistributions) {
      distMap.set(`${d.studentId}_${d.textileTypeId}`, d);
    }

    // Filtrage des élèves pour la vue textile
    let filteredStudents = this.students;
    if (this.selectedTextileFilterId !== 'all' && this.textileStatusFilter !== 'all') {
      filteredStudents = filteredStudents.filter((s) => {
        const d = distMap.get(`${s.id}_${this.selectedTextileFilterId}`);
        const isReceived = Boolean(d && d.received);
        return this.textileStatusFilter === 'received' ? isReceived : !isReceived;
      });
    }

    // Calcul des statistiques
    const activeTextileType = this.textileTypes.find((t) => t.id === this.selectedTextileFilterId);
    let totalAssigned = 0;
    const totalStudentsCount = this.allStudents.length;

    if (activeTextileType) {
      totalAssigned = this.allStudents.filter((s) => {
        const d = distMap.get(`${s.id}_${activeTextileType.id}`);
        return d && d.received;
      }).length;
    } else {
      // Moyenne ou somme globale
      totalAssigned = this.textileDistributions.filter((d) => d.received).length;
    }

    const percent = totalStudentsCount > 0 && activeTextileType ? Math.round((totalAssigned / totalStudentsCount) * 100) : 0;

    return `
      <!-- Barre de sélection du textile actif -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px 10px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; gap: 6px; align-items: center; overflow-x: auto; padding-bottom: 2px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Textile :</span>
          <button class="chip-compact ${this.selectedTextileFilterId === 'all' ? 'active' : ''}" data-textile-id="all">
            Tous les textiles (${this.textileTypes.length})
          </button>
          ${this.textileTypes.map((t) => {
            const count = this.allStudents.filter((s) => {
              const d = distMap.get(`${s.id}_${t.id}`);
              return d && d.received;
            }).length;
            return `
              <button class="chip-compact ${this.selectedTextileFilterId === t.id ? 'active' : ''}" data-textile-id="${t.id}">
                ${this.escapeHtml(t.name)} (${count}/${totalStudentsCount})
              </button>
            `;
          }).join('')}
        </div>

        <!-- Statistique récapitulative -->
        ${activeTextileType ? `
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-hover); border-radius: var(--radius-sm); padding: 6px 10px; font-size: 0.78rem;">
            <span><strong>${this.escapeHtml(activeTextileType.name)}</strong> : <strong style="color: var(--accent-presence);">${totalAssigned}</strong> distribués sur <strong>${totalStudentsCount}</strong> élèves</span>
            <span style="font-weight: 700; color: var(--accent-presence);">${percent}%</span>
          </div>
        ` : ''}
      </div>

      <!-- Filtres & Actions groupées -->
      <div class="filter-section">
        <div class="filter-row-compact">
          <div class="search-bar-compact">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></svg>
            <input type="search" id="eleves-search" class="search-input-compact" placeholder="Recherche..." value="${this.escapeHtml(this.searchQuery)}" autocomplete="off" />
            <button type="button" class="clear-search-btn-compact" id="eleves-clear-search" style="display: ${this.searchQuery ? 'flex' : 'none'};">✕</button>
          </div>

          <div id="eleves-year-chips" class="chips-container-compact">${renderYearChips(this.yearsList, this.selectedYears)}</div>

          ${this.selectedTextileFilterId !== 'all' ? `
            <select id="textiles-status-filter" class="search-input-compact" style="width: auto; height: 32px; font-size: 0.75rem;">
              <option value="all" ${this.textileStatusFilter === 'all' ? 'selected' : ''}>Tous les statuts</option>
              <option value="received" ${this.textileStatusFilter === 'received' ? 'selected' : ''}>✓ Reçus</option>
              <option value="not_received" ${this.textileStatusFilter === 'not_received' ? 'selected' : ''}>✗ Non reçus</option>
            </select>
          ` : ''}
        </div>
      </div>

      <!-- Barre d'action rapide pour distribution groupée -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px 12px; margin-top: 2px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
          <input type="checkbox" id="textiles-select-all" ${this.selectedStudentIds.size > 0 && this.selectedStudentIds.size === filteredStudents.length ? 'checked' : ''} />
          <span>Tout cocher (${this.selectedStudentIds.size}/${filteredStudents.length})</span>
        </label>

        <button class="btn btn-primary btn-xs" id="textiles-batch-btn" style="min-height: 32px; padding: 0 12px; font-weight: 700; font-size: 0.78rem;">
          ⚡ ${STRINGS.textiles.batchDistribution} ${this.selectedStudentIds.size > 0 ? `(${this.selectedStudentIds.size})` : ''}
        </button>
      </div>

      <!-- Tableau / Cartes des dotations textiles -->
      <div style="overflow-x: auto; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
        <table class="data-table" style="margin: 0; font-size: 0.8rem;">
          <thead>
            <tr>
              <th style="width: 32px; text-align: center;">✓</th>
              <th>Élève</th>
              <th>Classe</th>
              ${this.selectedTextileFilterId === 'all'
                ? this.textileTypes.map((t) => `<th style="text-align: center;">${this.escapeHtml(t.name)}</th>`).join('')
                : `<th style="text-align: center;">${this.escapeHtml(activeTextileType?.name || 'Statut')}</th>`}
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.length === 0 ? `
              <tr>
                <td colspan="${this.selectedTextileFilterId === 'all' ? 3 + this.textileTypes.length : 4}" style="text-align: center; color: var(--text-muted); padding: 20px;">
                  Aucun élève correspondant aux critères.
                </td>
              </tr>
            ` : filteredStudents.map((student) => {
              const isChecked = this.selectedStudentIds.has(student.id);
              return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="text-align: center; vertical-align: middle;">
                    <input type="checkbox" class="textile-student-checkbox" data-student-id="${student.id}" ${isChecked ? 'checked' : ''} />
                  </td>
                  <td style="vertical-align: middle; cursor: pointer;" class="textile-student-row" data-student-id="${student.id}">
                    <strong>${this.escapeHtml(student.lastName)}</strong> ${this.escapeHtml(student.firstName)}
                  </td>
                  <td style="vertical-align: middle;">
                    <span class="badge-year-compact">${this.escapeHtml(student.year)}</span>
                  </td>
                  ${this.selectedTextileFilterId === 'all'
                    ? this.textileTypes.map((t) => {
                        const d = distMap.get(`${student.id}_${t.id}`);
                        const isReceived = Boolean(d && d.received);
                        return `
                          <td style="text-align: center; vertical-align: middle; padding: 4px 6px;">
                            <button
                              type="button"
                              class="${isReceived ? 'btn-textile-received' : 'btn-textile-none'} textile-toggle-btn"
                              data-student-id="${student.id}"
                              data-textile-id="${t.id}"
                              title="${isReceived ? `Reçu le ${d?.receivedDate || ''}` : 'Non reçu - Cliquez pour attribuer'}"
                            >
                              ${isReceived ? `✓ ${d?.receivedDate ? d.receivedDate.substring(5) : 'Reçu'}` : '✗ Non'}
                            </button>
                          </td>
                        `;
                      }).join('')
                    : (() => {
                        const t = activeTextileType!;
                        const d = distMap.get(`${student.id}_${t.id}`);
                        const isReceived = Boolean(d && d.received);
                        return `
                          <td style="text-align: center; vertical-align: middle; padding: 4px 6px;">
                            <button
                              type="button"
                              class="${isReceived ? 'btn-textile-received' : 'btn-textile-none'} textile-toggle-btn"
                              data-student-id="${student.id}"
                              data-textile-id="${t.id}"
                              title="${isReceived ? `Reçu le ${d?.receivedDate || ''}` : 'Non reçu - Cliquez pour attribuer'}"
                            >
                              ${isReceived ? `✓ Reçu (${d?.receivedDate || 'Aujourd\'hui'})` : '✗ Non reçu'}
                            </button>
                          </td>
                        `;
                      })()}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private attachEvents(): void {
    // 1. Bascule d'onglet Élèves / Textiles
    const subTabContainer = this.container.querySelector('#eleves-subtab-toggle') as HTMLElement;
    if (subTabContainer) {
      setupSegmentedToggleEvents(subTabContainer, async (val) => {
        this.activeSubTab = val as 'eleves' | 'textiles';
        this.selectedStudentIds.clear();
        await this.loadDataAndRender();
      });
    }

    // 2. Recherche
    const searchInput = this.container.querySelector<HTMLInputElement>('#eleves-search');
    if (searchInput) {
      const onSearchUpdate = async () => {
        this.searchQuery = searchInput.value;
        if (this.activeSubTab === 'eleves') {
          await this.updateFilteredListOnly();
        } else {
          await this.loadDataAndRender();
        }
      };
      searchInput.addEventListener('input', onSearchUpdate);
      searchInput.addEventListener('search', onSearchUpdate);
    }

    const clearBtn = this.container.querySelector('#eleves-clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        this.searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (this.activeSubTab === 'eleves') {
          await this.updateFilteredListOnly();
        } else {
          await this.loadDataAndRender();
        }
      });
    }

    // 3. Filtres Années
    setupYearChipsEvents(
      this.container,
      () => this.selectedYears,
      async (years) => {
        this.selectedYears = years;
        if (this.activeSubTab === 'eleves') {
          await this.updateFilteredListOnly();
        } else {
          await this.loadDataAndRender();
        }
      }
    );

    // 4. Mode Élèves : Cartes & Ajout
    if (this.activeSubTab === 'eleves') {
      const inactiveCheckbox = this.container.querySelector<HTMLInputElement>('#eleves-show-inactive');
      if (inactiveCheckbox) {
        inactiveCheckbox.addEventListener('change', async () => {
          this.showInactive = inactiveCheckbox.checked;
          await this.updateFilteredListOnly();
        });
      }

      setupAZBarEvents(
        this.container,
        () => this.selectedLetter,
        async (letter) => {
          this.selectedLetter = letter;
          await this.updateFilteredListOnly();
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
    } else {
      // 5. Mode Textiles : Sélecteurs & Actions
      const firstCreateBtn = this.container.querySelector('#textiles-create-first-btn');
      if (firstCreateBtn) {
        firstCreateBtn.addEventListener('click', () => {
          this.openCreateTextileTypeModal();
        });
      }

      const addTypeBtn = this.container.querySelector('#textiles-add-type-btn');
      if (addTypeBtn) {
        addTypeBtn.addEventListener('click', () => {
          this.openCreateTextileTypeModal();
        });
      }

      const manageBtn = this.container.querySelector('#textiles-manage-btn');
      if (manageBtn) {
        manageBtn.addEventListener('click', () => {
          this.openManageTextilesModal();
        });
      }

      const exportBtn = this.container.querySelector('#textiles-export-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
          const allStuds = await getAllStudents();
          await exportTextilesToExcel(allStuds, this.textileTypes, this.textileDistributions);
          showToast('Dotations exportées vers Excel !');
        });
      }

      const textileChips = this.container.querySelectorAll<HTMLButtonElement>('.chip-compact[data-textile-id]');
      textileChips.forEach((chip) => {
        chip.addEventListener('click', async () => {
          this.selectedTextileFilterId = chip.dataset.textileId || 'all';
          await this.loadDataAndRender();
        });
      });

      const statusSelect = this.container.querySelector<HTMLSelectElement>('#textiles-status-filter');
      if (statusSelect) {
        statusSelect.addEventListener('change', async () => {
          this.textileStatusFilter = statusSelect.value as any;
          await this.loadDataAndRender();
        });
      }

      // Sélection globale
      const selectAllCheckbox = this.container.querySelector<HTMLInputElement>('#textiles-select-all');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
          if (selectAllCheckbox.checked) {
            this.students.forEach((s) => this.selectedStudentIds.add(s.id));
          } else {
            this.selectedStudentIds.clear();
          }
          this.container.querySelectorAll<HTMLInputElement>('.textile-student-checkbox').forEach((cb) => {
            cb.checked = selectAllCheckbox.checked;
          });
          const batchBtn = this.container.querySelector('#textiles-batch-btn');
          if (batchBtn) {
            batchBtn.textContent = `⚡ ${STRINGS.textiles.batchDistribution} (${this.selectedStudentIds.size})`;
          }
        });
      }

      // Sélection individuelle
      const studentCheckboxes = this.container.querySelectorAll<HTMLInputElement>('.textile-student-checkbox');
      studentCheckboxes.forEach((cb) => {
        cb.addEventListener('change', () => {
          const sId = cb.dataset.studentId;
          if (!sId) return;
          if (cb.checked) {
            this.selectedStudentIds.add(sId);
          } else {
            this.selectedStudentIds.delete(sId);
          }
          if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.selectedStudentIds.size > 0 && this.selectedStudentIds.size === this.students.length;
          }
          const batchBtn = this.container.querySelector('#textiles-batch-btn');
          if (batchBtn) {
            batchBtn.textContent = `⚡ ${STRINGS.textiles.batchDistribution} (${this.selectedStudentIds.size})`;
          }
        });
      });

      // Clic 1-tap sur bouton toggle textile
      const toggleBtns = this.container.querySelectorAll<HTMLButtonElement>('.textile-toggle-btn');
      toggleBtns.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const sId = btn.dataset.studentId;
          const tId = btn.dataset.textileId;
          if (!sId || !tId) return;

          const updated = await toggleStudentTextile(sId, tId);
          SyncEngine.getInstance().scheduleDebouncedSync();
          showToast(updated.received ? 'Dotation marquée comme reçue !' : 'Dotation retirée.');
          await this.loadDataAndRender();
        });
      });

      // Distribution groupée
      const batchBtn = this.container.querySelector('#textiles-batch-btn');
      if (batchBtn) {
        batchBtn.addEventListener('click', () => {
          this.openBatchDistributionModal();
        });
      }

      // Clic sur le nom de l'élève pour aller sur sa fiche
      const studentRows = this.container.querySelectorAll<HTMLElement>('.textile-student-row');
      studentRows.forEach((row) => {
        row.addEventListener('click', () => {
          const sId = row.dataset.studentId;
          if (sId) {
            this.options.onStudentCardClick(sId);
          }
        });
      });
    }
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

  // --- Modale de distribution groupée ---
  private openBatchDistributionModal(): void {
    const modalContainer = this.container.querySelector('#eleves-modal-container');
    if (!modalContainer) return;

    let targetStudentIds: string[] = Array.from(this.selectedStudentIds);
    const hasSelection = targetStudentIds.length > 0;
    if (!hasSelection) {
      targetStudentIds = this.students.map((s) => s.id);
    }

    const today = getTodayBrussels();
    const defaultTextileId = this.selectedTextileFilterId !== 'all' ? this.selectedTextileFilterId : (this.textileTypes[0]?.id || '');

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="batch-modal-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              ⚡ ${STRINGS.textiles.batchDistribution}
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="batch-modal-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="batch-dist-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: var(--bg-surface-hover); border-radius: var(--radius-md); padding: 10px; font-size: 0.85rem;">
              Destinataires : <strong>${targetStudentIds.length} élève(s)</strong>
              ${!hasSelection ? '<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">(Tous les élèves actuellement filtrés)</div>' : ''}
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Équipement / Textile à attribuer *
              </label>
              <select id="batch-textile-select" class="search-input" style="appearance: auto;" required>
                ${this.textileTypes.map((t) => `
                  <option value="${t.id}" ${t.id === defaultTextileId ? 'selected' : ''}>${this.escapeHtml(t.name)}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Action de distribution
              </label>
              <select id="batch-action-select" class="search-input" style="appearance: auto;">
                <option value="receive">✓ Marquer comme Reçu</option>
                <option value="remove">✗ Marquer comme Non reçu (Retirer)</option>
              </select>
            </div>

            <div id="batch-date-group">
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                Date de remise
              </label>
              <input type="date" id="batch-date-input" class="search-input" value="${today}" style="min-height: 38px; padding: 4px 8px;" />
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary" id="batch-cancel-btn" style="flex: 1; min-height: 40px;">
                ${STRINGS.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1.5; min-height: 40px; font-weight: 700;">
                Valider (${targetStudentIds.length} élèves)
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeOverlay = () => {
      modalContainer.innerHTML = '';
    };

    modalContainer.querySelector('#batch-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === modalContainer.querySelector('#batch-modal-overlay')) closeOverlay();
    });
    modalContainer.querySelector('#batch-modal-close-btn')?.addEventListener('click', closeOverlay);
    modalContainer.querySelector('#batch-cancel-btn')?.addEventListener('click', closeOverlay);

    const actionSelect = modalContainer.querySelector<HTMLSelectElement>('#batch-action-select');
    const dateGroup = modalContainer.querySelector<HTMLElement>('#batch-date-group');
    if (actionSelect && dateGroup) {
      actionSelect.addEventListener('change', () => {
        dateGroup.style.display = actionSelect.value === 'receive' ? 'block' : 'none';
      });
    }

    const form = modalContainer.querySelector<HTMLFormElement>('#batch-dist-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textileId = modalContainer.querySelector<HTMLSelectElement>('#batch-textile-select')?.value;
        const isReceive = actionSelect?.value === 'receive';
        const dateVal = modalContainer.querySelector<HTMLInputElement>('#batch-date-input')?.value || today;

        if (!textileId) return;

        const count = await batchDistributeTextiles(targetStudentIds, textileId, isReceive, dateVal);
        SyncEngine.getInstance().scheduleDebouncedSync();
        showToast(`${count} élève(s) mis à jour avec succès !`);
        this.selectedStudentIds.clear();
        closeOverlay();
        await this.loadDataAndRender();
      });
    }
  }

  // --- Modale de création de type de textile ---
  private openCreateTextileTypeModal(): void {
    const modalContainer = this.container.querySelector('#eleves-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="create-textile-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              + ${STRINGS.textiles.createTextile}
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="create-textile-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <form id="create-textile-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
                ${STRINGS.textiles.textileName} *
              </label>
              <input type="text" id="new-textile-name" class="search-input" placeholder="ex: T-shirt du club" required autocomplete="off" />
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary" id="create-textile-cancel-btn" style="flex: 1; min-height: 40px;">
                ${STRINGS.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1.5; min-height: 40px; font-weight: 700;">
                Créer l'équipement
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeOverlay = () => {
      modalContainer.innerHTML = '';
    };

    modalContainer.querySelector('#create-textile-overlay')?.addEventListener('click', (e) => {
      if (e.target === modalContainer.querySelector('#create-textile-overlay')) closeOverlay();
    });
    modalContainer.querySelector('#create-textile-close-btn')?.addEventListener('click', closeOverlay);
    modalContainer.querySelector('#create-textile-cancel-btn')?.addEventListener('click', closeOverlay);

    const form = modalContainer.querySelector<HTMLFormElement>('#create-textile-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = modalContainer.querySelector<HTMLInputElement>('#new-textile-name');
        const name = nameInput?.value.trim();
        if (!name) return;

        const created = await createTextileType(name);
        SyncEngine.getInstance().scheduleDebouncedSync();
        showToast(`Textile « ${created.name} » créé !`);
        this.selectedTextileFilterId = created.id;
        closeOverlay();
        await this.loadDataAndRender();
      });
    }
  }

  // --- Modale de gestion des types de textiles ---
  private async openManageTextilesModal(): Promise<void> {
    const modalContainer = this.container.querySelector('#eleves-modal-container');
    if (!modalContainer) return;

    const types = await getTextileTypes();

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="manage-textiles-overlay">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              ⚙️ ${STRINGS.textiles.manageTextiles}
            </h3>
            <button type="button" class="btn btn-secondary btn-xs" id="manage-textiles-close-btn" style="min-height: 32px; padding: 0 10px;">✕</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; max-height: 50vh; overflow-y: auto;">
            ${types.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.85rem;">Aucun textile configuré.</p>' : ''}
            ${types.map((t) => `
              <div class="textile-card-item" data-type-id="${t.id}">
                <input type="text" class="search-input-compact textile-rename-input" value="${this.escapeHtml(t.name)}" style="flex: 1;" />
                <button type="button" class="btn btn-primary btn-xs textile-save-name-btn" data-type-id="${t.id}" style="min-height: 32px; padding: 0 8px;">
                  Sauver
                </button>
                <button type="button" class="btn btn-danger btn-xs textile-delete-type-btn" data-type-id="${t.id}" style="min-height: 32px; padding: 0 8px;">
                  🗑️
                </button>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 14px; pt: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" id="manage-textiles-done-btn" style="min-height: 38px; padding: 0 16px;">
              ${STRINGS.actions.close}
            </button>
          </div>
        </div>
      </div>
    `;

    const closeOverlay = () => {
      modalContainer.innerHTML = '';
    };

    modalContainer.querySelector('#manage-textiles-overlay')?.addEventListener('click', (e) => {
      if (e.target === modalContainer.querySelector('#manage-textiles-overlay')) closeOverlay();
    });
    modalContainer.querySelector('#manage-textiles-close-btn')?.addEventListener('click', closeOverlay);
    modalContainer.querySelector('#manage-textiles-done-btn')?.addEventListener('click', async () => {
      closeOverlay();
      await this.loadDataAndRender();
    });

    const saveBtns = modalContainer.querySelectorAll<HTMLButtonElement>('.textile-save-name-btn');
    saveBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const typeId = btn.dataset.typeId;
        const row = modalContainer.querySelector(`.textile-card-item[data-type-id="${typeId}"]`);
        const input = row?.querySelector<HTMLInputElement>('.textile-rename-input');
        const newName = input?.value.trim();
        if (typeId && newName) {
          await updateTextileType(typeId, newName);
          SyncEngine.getInstance().scheduleDebouncedSync();
          showToast('Textile renommé.');
        }
      });
    });

    const deleteBtns = modalContainer.querySelectorAll<HTMLButtonElement>('.textile-delete-type-btn');
    deleteBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const typeId = btn.dataset.typeId;
        if (typeId && confirm(STRINGS.textiles.confirmDeleteTextile)) {
          await deleteTextileType(typeId);
          SyncEngine.getInstance().scheduleDebouncedSync();
          showToast('Textile et ses attributions supprimés.');
          if (this.selectedTextileFilterId === typeId) {
            this.selectedTextileFilterId = 'all';
          }
          await this.openManageTextilesModal();
        }
      });
    });
  }

  // --- Modale création / édition élève ---
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
