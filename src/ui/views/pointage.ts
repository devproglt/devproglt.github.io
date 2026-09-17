import { STRINGS } from '../strings';
import { renderYearChips, setupYearChipsEvents } from '../components/chips';
import { renderAZBar, setupAZBarEvents, computeAvailableLetters, updateAZBarAvailability } from '../components/az-bar';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { applyAccentTheme } from '../components/header';
import { triggerHapticFeedback, showToast } from '../components/toast';
import { getFilteredStudents, createStudent, type StudentRecord } from '../../db/students';
import { getAttendancesByDateAndType, toggleAttendance } from '../../db/attendances';
import { getYearsList } from '../../db/meta';

export interface PointageViewOptions {
  date: string;
  type: 'presence' | 'course';
  onStudentCardClick: (studentId: string) => void;
  onRefreshNeeded: () => void;
  onTypeChange?: (type: 'presence' | 'course') => void;
}

export class PointageView {
  private container: HTMLElement;
  public options: PointageViewOptions;

  private searchQuery = '';
  private selectedYears: string[] = ['all'];
  private selectedLetter = 'ALL';

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
    await this.loadDataAndRender();
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    applyAccentTheme(this.options.type);
    this.yearsList = await getYearsList();

    const attendances = await getAttendancesByDateAndType(this.options.date, this.options.type);
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

    const typeToggleHtml = renderSegmentedToggle(
      [
        { value: 'presence', label: STRINGS.types.presence },
        { value: 'course', label: STRINGS.types.course },
      ],
      this.options.type
    );

    const availableLetters = computeAvailableLetters(
      this.selectedYears.includes('all')
        ? this.allActiveStudents
        : this.allActiveStudents.filter((s) => {
            const yr = s.year.trim();
            return this.selectedYears.some((lvl) => yr === lvl || yr.startsWith(lvl));
          })
    );

    this.container.innerHTML = `
      <div style="padding: 12px 16px;">
        <div style="margin-bottom: 12px;">
          ${typeToggleHtml}
        </div>

        <div class="filter-section">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></svg>
            <input type="search" id="pointage-search" class="search-input" placeholder="${STRINGS.header.searchPlaceholder}" value="${this.escapeHtml(this.searchQuery)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
            <button type="button" class="clear-search-btn" id="pointage-clear-search" style="display: ${this.searchQuery ? 'flex' : 'none'};">✕</button>
          </div>

          <div id="pointage-year-chips">${renderYearChips(this.yearsList, this.selectedYears)}</div>

          <div id="pointage-az-bar">${renderAZBar(availableLetters, this.selectedLetter)}</div>
        </div>

        <div class="student-list" id="pointage-student-list" style="margin-top: 12px; padding: 0;">
          ${this.renderStudentListHtml()}
        </div>
      </div>
    `;

    this.attachEvents();
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
        if (!studentId) return;

        triggerHapticFeedback();
        const newRecord = await toggleAttendance(studentId, this.options.date, this.options.type);
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

        await toggleAttendance(newStudent.id, this.options.date, this.options.type, true);
        showToast(`Élève ${firstName} créé et marqué présent !`);
        this.searchQuery = '';
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }
  }

  private attachEvents(): void {
    setupSegmentedToggleEvents(this.container, (val) => {
      const newType = val as 'presence' | 'course';
      this.options.type = newType;
      if (this.options.onTypeChange) {
        this.options.onTypeChange(newType);
      }
      this.loadDataAndRender();
      this.options.onRefreshNeeded();
    });

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
