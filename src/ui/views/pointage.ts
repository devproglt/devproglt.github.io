import { STRINGS } from '../strings';
import { renderAZBar, setupAZBarEvents } from '../components/az-bar';
import { renderYearChips, setupYearChipsEvents } from '../components/chips';
import { triggerHapticFeedback, showToast } from '../components/toast';
import { getFilteredStudents, createStudent, type StudentRecord } from '../../db/students';
import { getAttendancesByDateAndType, toggleAttendance } from '../../db/attendances';
import { getYearsList } from '../../db/meta';
import { calculateDaySummary } from '../../domain/stats';
import { normalizeText } from '../../domain/normalize';

export interface PointageViewOptions {
  date: string;
  type: 'presence' | 'course';
  onStudentCardClick: (studentId: string) => void;
  onRefreshNeeded: () => void;
}

export class PointageView {
  private container: HTMLElement;
  private options: PointageViewOptions;

  private searchQuery = '';
  private selectedYears: string[] = ['all'];
  private selectedLetter = 'ALL';

  private students: StudentRecord[] = [];
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
    this.yearsList = await getYearsList();

    // Récupère les pointages pour la date et le type
    const attendances = await getAttendancesByDateAndType(this.options.date, this.options.type);
    this.attendanceMap.clear();
    for (const att of attendances) {
      if (att.present) {
        this.attendanceMap.set(att.studentId, true);
      }
    }

    // Récupère tous les élèves actifs pour déterminer les lettres disponibles
    const allActiveStudents = await getFilteredStudents({ onlyActive: true });
    
    // Calcul des lettres disponibles d'après les élèves actifs (apres filtres de recherche et d'année s'il y a lieu)
    let filteredForLetters = allActiveStudents;
    if (this.selectedYears.length > 0 && !this.selectedYears.includes('all')) {
      const yrSet = new Set(this.selectedYears);
      filteredForLetters = filteredForLetters.filter((s) => yrSet.has(s.year));
    }
    if (this.searchQuery.trim()) {
      const normQ = normalizeText(this.searchQuery);
      filteredForLetters = filteredForLetters.filter((s) => s.searchKey.includes(normQ));
    }

    const availableLetters = new Set<string>();
    for (const s of filteredForLetters) {
      const fnNorm = normalizeText(s.firstName);
      if (fnNorm.length > 0) {
        availableLetters.add(fnNorm.charAt(0).toUpperCase());
      }
    }

    // Récupération des élèves filtrés
    this.students = await getFilteredStudents({
      query: this.searchQuery,
      years: this.selectedYears,
      initialLetter: this.selectedLetter,
      onlyActive: true,
    });

    // Calcul du résumé pour le compteur fixe
    const studentMapForSummary = new Map(allActiveStudents.map((s) => [s.id, s]));
    const summary = calculateDaySummary(attendances, studentMapForSummary, this.options.type);

    this.container.innerHTML = `
      <div style="padding: 12px 16px;">
        <div class="filter-section">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="text" id="pointage-search" class="search-input" placeholder="${STRINGS.header.searchPlaceholder}" value="${this.escapeHtml(this.searchQuery)}" />
            ${this.searchQuery ? `<button class="clear-search-btn" id="pointage-clear-search">✕</button>` : ''}
          </div>

          <div>${renderYearChips(this.yearsList, this.selectedYears)}</div>
          <div>${renderAZBar(availableLetters, this.selectedLetter)}</div>

          ${(this.searchQuery || !this.selectedYears.includes('all') || this.selectedLetter !== 'ALL') ? `
            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-secondary" id="pointage-reset-filters" style="min-height: 36px; padding: 0 12px; font-size: 0.8rem;">
                ${STRINGS.header.resetFilters}
              </button>
            </div>
          ` : ''}
        </div>

        <div class="student-list" id="pointage-student-list" style="margin-top: 12px; padding: 0;">
          ${this.renderStudentListHtml()}
        </div>
      </div>

      <div class="sticky-counter-bar">
        <div>
          <span>${this.options.type === 'presence' ? STRINGS.types.presence : STRINGS.types.course} : </span>
          <span style="color: var(--accent-active); font-size: 1.1rem;">${summary.total}</span>
        </div>
        <div style="font-weight: 500; font-size: 0.85rem; color: var(--text-secondary);">
          <span>F: ${summary.girls}</span> | <span>G: ${summary.boys}</span>
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
            <button class="btn btn-primary" id="pointage-add-quick" style="margin-top: 16px;">
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

  private attachEvents(): void {
    // Recherche par frappe
    const searchInput = this.container.querySelector<HTMLInputElement>('#pointage-search');
    if (searchInput) {
      searchInput.focus();
      // Replacer le curseur à la fin du texte
      const valLen = searchInput.value.length;
      searchInput.setSelectionRange(valLen, valLen);

      searchInput.addEventListener('input', () => {
        this.searchQuery = searchInput.value;
        this.loadDataAndRender();
      });
    }

    const clearSearchBtn = this.container.querySelector('#pointage-clear-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.loadDataAndRender();
      });
    }

    const resetFiltersBtn = this.container.querySelector('#pointage-reset-filters');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.selectedYears = ['all'];
        this.selectedLetter = 'ALL';
        this.loadDataAndRender();
      });
    }

    // Événements Puces d'années
    setupYearChipsEvents(this.container, this.selectedYears, (years) => {
      this.selectedYears = years;
      this.loadDataAndRender();
    });

    // Événements Barre A-Z
    setupAZBarEvents(this.container, (letter) => {
      this.selectedLetter = letter;
      this.loadDataAndRender();
    });

    // Appui sur une carte élève (Bascule instantanée + retour haptique)
    const cards = this.container.querySelectorAll<HTMLElement>('.student-card');
    cards.forEach((card) => {
      card.addEventListener('click', async () => {
        // Empêcher l'événement si appui sur fiche
        const studentId = card.dataset.studentId;
        if (!studentId) return;

        triggerHapticFeedback();
        const newRecord = await toggleAttendance(studentId, this.options.date, this.options.type);
        this.attendanceMap.set(studentId, newRecord.present);

        // Mise à jour visuelle ultra rapide (<100ms)
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

    // Bouton d'ajout rapide si aucun résultat
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

        // Marquer présent directement
        await toggleAttendance(newStudent.id, this.options.date, this.options.type, true);
        showToast(`Élève ${firstName} créé et marqué présent !`);
        this.searchQuery = '';
        this.loadDataAndRender();
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
