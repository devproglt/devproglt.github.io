import { STRINGS } from '../strings';
import { renderSegmentedToggle, setupSegmentedToggleEvents } from '../components/toggle';
import { showToast } from '../components/toast';
import { getAttendancesByDateAndType, toggleAttendance } from '../../db/attendances';
import { getAllStudents, type StudentRecord } from '../../db/students';
import { calculateDaySummary } from '../../domain/stats';
import { formatTimeBrussels, formatReadableDate } from '../../domain/dates';

export interface JourViewOptions {
  date: string;
  type: 'presence' | 'course';
  onStudentCardClick: (studentId: string) => void;
  onRefreshNeeded: () => void;
}

export class JourView {
  private container: HTMLElement;
  private options: JourViewOptions;
  private activeTab: 'presence' | 'course';

  constructor(container: HTMLElement, options: JourViewOptions) {
    this.container = container;
    this.options = options;
    this.activeTab = options.type;
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    const attendances = await getAttendancesByDateAndType(this.options.date, this.activeTab);
    const presentAttendances = attendances.filter((a) => a.present);

    const allStudents = await getAllStudents();
    const studentsMap = new Map<string, StudentRecord>(allStudents.map((s) => [s.id, s]));

    const summary = calculateDaySummary(presentAttendances, new Map(allStudents.map(s => [s.id, s])), this.activeTab);

    // Liste des présents ordonnée par heure de pointage décroissante
    const presentList = presentAttendances
      .map((att) => ({
        attendance: att,
        student: studentsMap.get(att.studentId),
      }))
      .filter((item): item is { attendance: typeof item.attendance; student: StudentRecord } => Boolean(item.student))
      .sort((a, b) => b.attendance.markedAt - a.attendance.markedAt);

    const tabsToggleHtml = renderSegmentedToggle(
      [
        { value: 'presence', label: STRINGS.types.presence },
        { value: 'course', label: STRINGS.types.course },
      ],
      this.activeTab
    );

    const yearRowsHtml = Object.entries(summary.byYear)
      .sort(([a], [b]) => a.localeCompare(b))
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

    this.container.innerHTML = `
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2>${formatReadableDate(this.options.date)}</h2>
          <button class="btn btn-secondary" id="jour-copy-summary-btn" style="min-height: 38px; padding: 0 12px;">
            ${STRINGS.actions.copySummary}
          </button>
        </div>

        <div>${tabsToggleHtml}</div>

        <!-- Carte de résumé -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary);">
              Résumé — ${this.activeTab === 'presence' ? STRINGS.types.presence : STRINGS.types.course}
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
            <table class="data-table" style="margin-top: 8px;">
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
          <h3 style="margin-bottom: 8px; font-size: var(--font-size-base);">${STRINGS.nav.jour} (${presentList.length})</h3>
          <p style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 8px;">${STRINGS.stats.longPressHint}</p>

          ${presentList.length === 0 ? `
            <div style="text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              ${STRINGS.stats.noAttendanceToday}
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${presentList
                .map(
                  (item) => `
                <div class="student-card" data-student-id="${item.student.id}" data-attendance-id="${item.attendance.id}">
                  <div class="student-info">
                    <div class="student-name">${this.escapeHtml(item.student.firstName)} ${this.escapeHtml(item.student.lastName)}</div>
                    <div class="student-meta">
                      <span class="badge-year">${this.escapeHtml(item.student.year)}</span>
                      <span class="badge-gender ${item.student.gender}">${item.student.gender === 'F' ? 'Fille' : 'Garçon'}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: var(--font-size-xs); color: var(--text-muted); font-weight: 500;">
                      ${formatTimeBrussels(item.attendance.markedAt)}
                    </span>
                    <button class="btn btn-danger jour-cancel-btn" style="min-height: 36px; padding: 0 10px; font-size: 0.75rem;" title="Annuler ce pointage">
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
    `;

    this.attachEvents(summary);
  }

  private attachEvents(summary: ReturnType<typeof calculateDaySummary>): void {
    setupSegmentedToggleEvents(this.container, (val) => {
      this.activeTab = val as 'presence' | 'course';
      this.loadDataAndRender();
    });

    const copyBtn = this.container.querySelector('#jour-copy-summary-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        let text = `Résumé des ${this.activeTab === 'presence' ? 'présences' : 'courses'} — ${formatReadableDate(this.options.date)}\n`;
        text += `Total: ${summary.total} (Filles: ${summary.girls}, Garçons: ${summary.boys}, Internes: ${summary.internals})\n\n`;
        text += `Répartition par année:\n`;
        for (const [yr, counts] of Object.entries(summary.byYear)) {
          text += `- ${yr}: ${counts.total} (F: ${counts.girls}, G: ${counts.boys}, I: ${counts.internals})\n`;
        }
        navigator.clipboard.writeText(text);
        showToast(STRINGS.actions.copiedSuccess);
      });
    }

    // Appui pour ouvrir la fiche ou annuler
    const cards = this.container.querySelectorAll<HTMLElement>('.student-card');
    cards.forEach((card) => {
      const studentId = card.dataset.studentId;
      if (!studentId) return;

      const cancelBtn = card.querySelector('.jour-cancel-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await toggleAttendance(studentId, this.options.date, this.activeTab, false);
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
