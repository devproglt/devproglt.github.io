import { STRINGS } from '../strings';
import { showToast } from '../components/toast';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { getAllStudents, type StudentRecord } from '../../db/students';
import { getAllAttendances, type AttendanceRecord } from '../../db/attendances';
import { getYearsList } from '../../db/meta';
import { calculateAllStudentStats, type StudentStats } from '../../domain/stats';
import { formatReadableDate, getSchoolYearRange, getMonthRange, getTodayBrussels } from '../../domain/dates';
import { exportCurrentViewToExcel } from '../../io/export';

export interface HistoriqueViewOptions {
  onStudentCardClick: (studentId: string) => void;
  onInspectDateClick: (date: string) => void;
}

export type SortField = 'lastName' | 'firstName' | 'year' | 'presences' | 'courses' | 'total';
export type SortOrder = 'asc' | 'desc';

export class HistoriqueView {
  private container: HTMLElement;
  private options: HistoriqueViewOptions;

  private activeTab: 'students' | 'dates' = 'students';
  private periodPreset: 'all' | 'month' | 'schoolyear' | 'custom' = 'all';
  private startDate = '';
  private endDate = '';
  private yearFilter = 'all';
  private typeFilter = 'all';
  private includeInactive = false;

  private sortField: SortField = 'lastName';
  private sortOrder: SortOrder = 'asc';

  private students: StudentRecord[] = [];
  private attendances: AttendanceRecord[] = [];
  private yearsList: string[] = [];

  constructor(container: HTMLElement, options: HistoriqueViewOptions) {
    this.container = container;
    this.options = options;
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    this.yearsList = await getYearsList();
    this.students = await getAllStudents();
    this.attendances = await getAllAttendances();

    // Filtrage par période
    let filteredAttendances = this.attendances.filter((a) => a.present);
    if (this.startDate) {
      filteredAttendances = filteredAttendances.filter((a) => a.date >= this.startDate);
    }
    if (this.endDate) {
      filteredAttendances = filteredAttendances.filter((a) => a.date <= this.endDate);
    }
    if (this.typeFilter !== 'all') {
      filteredAttendances = filteredAttendances.filter((a) => a.type === this.typeFilter);
    }

    // Filtrage des élèves
    let filteredStudents = this.students;
    if (!this.includeInactive) {
      filteredStudents = filteredStudents.filter((s) => s.active);
    }
    if (this.yearFilter !== 'all') {
      filteredStudents = filteredStudents.filter((s) => s.year === this.yearFilter);
    }

    const statsMap = calculateAllStudentStats(filteredAttendances);

    this.container.innerHTML = `
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2>${STRINGS.nav.historique}</h2>
          <button class="btn btn-primary" id="historique-export-btn" style="min-height: 38px; padding: 0 12px; font-size: 0.8rem;">
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

        <!-- Filtres généraux -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <label style="font-size: var(--font-size-xs); font-weight: 600;">Période :</label>
            <button class="chip ${this.periodPreset === 'all' ? 'active' : ''}" id="preset-all">Tout</button>
            <button class="chip ${this.periodPreset === 'month' ? 'active' : ''}" id="preset-month">Ce mois</button>
            <button class="chip ${this.periodPreset === 'schoolyear' ? 'active' : ''}" id="preset-schoolyear">Année scolaire</button>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <input type="date" id="historique-start-date" value="${this.startDate}" class="search-input" style="min-height: 36px; padding: 4px; font-size: 0.75rem; flex: 1;" />
            <span style="font-size: var(--font-size-xs);">à</span>
            <input type="date" id="historique-end-date" value="${this.endDate}" class="search-input" style="min-height: 36px; padding: 4px; font-size: 0.75rem; flex: 1;" />

            <select id="historique-year-filter" class="search-input" style="min-height: 36px; padding: 4px; font-size: 0.75rem; flex: 1;">
              <option value="all">Toutes les années</option>
              ${this.yearsList.map((yr) => `<option value="${yr}" ${this.yearFilter === yr ? 'selected' : ''}>${yr}</option>`).join('')}
            </select>

            <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; white-space: nowrap;">
              <input type="checkbox" id="historique-inactive-chk" ${this.includeInactive ? 'checked' : ''} />
              Inactifs
            </label>
          </div>
        </div>

        <!-- Vue contenu par Élève ou par Date -->
        ${this.activeTab === 'students'
          ? this.renderStudentsTableHtml(filteredStudents, statsMap)
          : this.renderDatesListHtml(filteredAttendances)}
      </div>
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
      else if (this.sortField === 'year') comp = a.student.year.localeCompare(b.student.year, 'fr');
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
                <td><span class="badge-year">${this.escapeHtml(item.student.year)}</span></td>
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
    const datesMap = new Map<string, { presences: number; courses: number }>();
    for (const att of attendances) {
      let entry = datesMap.get(att.date);
      if (!entry) {
        entry = { presences: 0, courses: 0 };
        datesMap.set(att.date, entry);
      }
      if (att.type === 'presence') entry.presences++;
      else if (att.type === 'course') entry.courses++;
    }

    const sortedDates = Array.from(datesMap.keys()).sort().reverse();

    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${sortedDates.length === 0 ? `
          <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
            Aucun pointage trouvé pour cette période.
          </div>
        ` : sortedDates.map((dateStr) => {
          const entry = datesMap.get(dateStr)!;
          return `
            <div class="historique-date-card" data-date="${dateStr}" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
              <div>
                <div style="font-size: var(--font-size-base); font-weight: 600;">${formatReadableDate(dateStr)}</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: 2px;">${dateStr}</div>
              </div>
              <div style="display: flex; gap: 12px; font-size: var(--font-size-sm); font-weight: 700;">
                <span style="color: var(--accent-presence);">Prés. ${entry.presences}</span>
                <span style="color: var(--accent-course);">Cour. ${entry.courses}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
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

    // Presets de période
    const today = getTodayBrussels();
    const presetAll = this.container.querySelector('#preset-all');
    if (presetAll) {
      presetAll.addEventListener('click', () => {
        this.periodPreset = 'all';
        this.startDate = '';
        this.endDate = '';
        this.loadDataAndRender();
      });
    }

    const presetMonth = this.container.querySelector('#preset-month');
    if (presetMonth) {
      presetMonth.addEventListener('click', () => {
        this.periodPreset = 'month';
        const range = getMonthRange(today);
        this.startDate = range.start;
        this.endDate = range.end;
        this.loadDataAndRender();
      });
    }

    const presetSchoolYear = this.container.querySelector('#preset-schoolyear');
    if (presetSchoolYear) {
      presetSchoolYear.addEventListener('click', () => {
        this.periodPreset = 'schoolyear';
        const range = getSchoolYearRange(today);
        this.startDate = range.start;
        this.endDate = range.end;
        this.loadDataAndRender();
      });
    }

    // Champs de dates
    const startInput = this.container.querySelector<HTMLInputElement>('#historique-start-date');
    if (startInput) {
      startInput.addEventListener('change', () => {
        this.periodPreset = 'custom';
        this.startDate = startInput.value;
        this.loadDataAndRender();
      });
    }

    const endInput = this.container.querySelector<HTMLInputElement>('#historique-end-date');
    if (endInput) {
      endInput.addEventListener('change', () => {
        this.periodPreset = 'custom';
        this.endDate = endInput.value;
        this.loadDataAndRender();
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

    // Navigation cartes de dates
    const dateCards = this.container.querySelectorAll<HTMLElement>('.historique-date-card');
    dateCards.forEach((card) => {
      card.addEventListener('click', () => {
        const dateStr = card.dataset.date;
        if (dateStr) this.options.onInspectDateClick(dateStr);
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
