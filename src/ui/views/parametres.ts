import { STRINGS } from '../strings';
import { showToast } from '../components/toast';
import { getMeta, setMeta, getDeviceId, getYearsList, setYearsList } from '../../db/meta';
import { SyncEngine } from '../../sync/engine';
import { downloadImportTemplate, parseAndPreviewImport, executeImportTransaction, detectColumnMapping, type RawRow, getXLSXModule } from '../../io/import';
import { getAllStudents, createStudent, type StudentRecord } from '../../db/students';
import { getAllAttendances } from '../../db/attendances';
import { buildAttendanceId } from '../../domain/ids';
import { db } from '../../db/schema';
import { getTodayBrussels } from '../../domain/dates';

export interface ParametresViewOptions {
  onRefreshNeeded: () => void;
  onUpdateAppClick: () => void;
}

export class ParametresView {
  private container: HTMLElement;
  private options: ParametresViewOptions;

  constructor(container: HTMLElement, options: ParametresViewOptions) {
    this.container = container;
    this.options = options;
  }

  public async render(): Promise<void> {
    await this.loadDataAndRender();
  }

  private async loadDataAndRender(): Promise<void> {
    const syncUrl = await getMeta<string>('syncUrl', '');
    const syncToken = await getMeta<string>('syncToken', '');
    const deviceName = await getDeviceId();
    const lastSyncAt = await getMeta<number | null>('lastSyncAt', null);
    const yearsList = await getYearsList();

    const engine = SyncEngine.getInstance();
    const pendingCount = await engine.getPendingCount();

    const lastSyncStr = lastSyncAt ? new Date(lastSyncAt).toLocaleString('fr-BE') : 'Jamais';

    this.container.innerHTML = `
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 20px;">
        <h2>${STRINGS.nav.parametres}</h2>

        <!-- Synchronisation Google Sheets -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Synchronisation Google Sheets</h3>
          
          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${STRINGS.sync.syncUrl}
            </label>
            <input type="text" id="param-sync-url" class="search-input" value="${this.escapeHtml(syncUrl)}" placeholder="https://script.google.com/macros/s/.../exec" />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${STRINGS.sync.syncToken}
            </label>
            <input type="password" id="param-sync-token" class="search-input" value="${this.escapeHtml(syncToken)}" placeholder="Votre jeton de sécurité" />
          </div>

          <div>
            <label style="font-size: var(--font-size-xs); font-weight: 600; display: block; margin-bottom: 4px;">
              ${STRINGS.sync.deviceName}
            </label>
            <input type="text" id="param-device-name" class="search-input" value="${this.escapeHtml(deviceName)}" />
          </div>

          <div style="font-size: var(--font-size-xs); color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span>${STRINGS.sync.lastSync} <strong>${lastSyncStr}</strong></span>
            <span>En attente : <strong>${pendingCount}</strong></span>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 8px;">
            <button class="btn btn-secondary" id="param-save-sync-btn" style="flex: 1;">
              Enregistrer
            </button>
            <button class="btn btn-primary" id="param-sync-now-btn" style="flex: 1;">
              ${STRINGS.actions.syncNow}
            </button>
          </div>
        </section>

        <!-- Import / Export Excel -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Import & Export des données</h3>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label class="btn btn-secondary" style="cursor: pointer; width: 100%;">
              📂 ${STRINGS.actions.importExcel}
              <input type="file" id="param-import-file" accept=".xlsx, .xls, .csv" style="display: none;" />
            </label>

            <button class="btn btn-secondary" id="param-download-template-btn">
              📄 ${STRINGS.actions.downloadTemplate}
            </button>
          </div>

          <div id="param-import-preview-zone"></div>
        </section>

        <!-- Gestion des Années Scolaires -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Liste des Années / Classes</h3>

          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${yearsList.map((yr) => `
              <span class="chip" style="cursor: default;">
                ${this.escapeHtml(yr)}
                <button class="param-delete-year-btn" data-year="${this.escapeHtml(yr)}" style="background: none; border: none; margin-left: 6px; cursor: pointer; color: var(--color-danger); font-weight: bold;">✕</button>
              </span>
            `).join('')}
          </div>

          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <input type="text" id="param-add-year-input" class="search-input" placeholder="Ex: 5C" style="min-height: 40px; padding: 0 10px;" />
            <button class="btn btn-secondary" id="param-add-year-btn" style="min-height: 40px;">Ajouter</button>
          </div>
        </section>

        <!-- Sauvegarde Locale et Restauration -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Sauvegarde & Restauration (.json)</h3>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="param-backup-json-btn" style="flex: 1;">
              📥 ${STRINGS.actions.backupJson}
            </button>
            <label class="btn btn-secondary" style="flex: 1; cursor: pointer;">
              📤 ${STRINGS.actions.restoreJson}
              <input type="file" id="param-restore-file" accept=".json" style="display: none;" />
            </label>
          </div>
        </section>

        <!-- Démonstration & Application -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Application & Démonstration</h3>
          <p style="font-size: var(--font-size-xs); color: var(--text-secondary);">Version : 1.0.0 (PWA Standalone)</p>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-secondary" id="param-seed-demo-btn" style="background-color: var(--accent-presence-light); color: var(--accent-presence);">
              🌱 Générer un jeu de démonstration (200 élèves, 3 mois d'historique)
            </button>
            <button class="btn btn-secondary" id="param-update-app-btn">
              🔄 ${STRINGS.actions.updateApp}
            </button>
          </div>
        </section>
      </div>
    `;

    this.attachEvents(yearsList);
  }

  private attachEvents(yearsList: string[]): void {
    // Enregistrement des paramètres de sync
    const saveSyncBtn = this.container.querySelector('#param-save-sync-btn');
    if (saveSyncBtn) {
      saveSyncBtn.addEventListener('click', async () => {
        const urlInput = this.container.querySelector<HTMLInputElement>('#param-sync-url');
        const tokenInput = this.container.querySelector<HTMLInputElement>('#param-sync-token');
        const deviceInput = this.container.querySelector<HTMLInputElement>('#param-device-name');

        if (urlInput) await setMeta('syncUrl', urlInput.value.trim());
        if (tokenInput) await setMeta('syncToken', tokenInput.value.trim());
        if (deviceInput && deviceInput.value.trim()) await setMeta('deviceId', deviceInput.value.trim());

        showToast('Paramètres de synchronisation enregistrés.');
        this.options.onRefreshNeeded();
      });
    }

    // Synchronisation immédiate
    const syncNowBtn = this.container.querySelector('#param-sync-now-btn');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', async () => {
        showToast('Synchronisation en cours...');
        const res = await SyncEngine.getInstance().triggerSync('manual');
        if (res.success) {
          showToast(STRINGS.sync.syncSuccess);
          await this.loadDataAndRender();
        } else {
          showToast(res.message || STRINGS.sync.syncError);
        }
      });
    }

    // Télécharger le gabarit d'import Excel
    const templateBtn = this.container.querySelector('#param-download-template-btn');
    if (templateBtn) {
      templateBtn.addEventListener('click', async () => {
        await downloadImportTemplate();
      });
    }

    // Traitement de l'import Excel / CSV
    const importFileInput = this.container.querySelector<HTMLInputElement>('#param-import-file');
    if (importFileInput) {
      importFileInput.addEventListener('change', async () => {
        const file = importFileInput.files?.[0];
        if (!file) return;

        try {
          showToast('Lecture du fichier en cours...');
          const XLSX = await getXLSXModule();
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: RawRow[] = XLSX.utils.sheet_to_json(worksheet);

          if (rawRows.length === 0) {
            showToast('Fichier vide ou format non reconnu.');
            return;
          }

          const headers = Object.keys(rawRows[0]);
          const mapping = detectColumnMapping(headers);

          const existingStudents = await getAllStudents();
          const previewRows = await parseAndPreviewImport(rawRows, mapping, 'ignore', existingStudents);

          // Affichage de l'aperçu
          const previewZone = this.container.querySelector('#param-import-preview-zone');
          if (previewZone) {
            const createCount = previewRows.filter((r) => r.status === 'create').length;
            const skipCount = previewRows.filter((r) => r.status === 'skip').length;
            const errorCount = previewRows.filter((r) => r.status === 'error').length;

            previewZone.innerHTML = `
              <div style="background: var(--bg-surface-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; margin-top: 8px;">
                <h4 style="font-size: var(--font-size-sm); font-weight: 700; margin-bottom: 6px;">Aperçu de l'importation :</h4>
                <div style="font-size: var(--font-size-xs); display: flex; gap: 12px;">
                  <span style="color: var(--color-success);">Nouveaux : <strong>${createCount}</strong></span>
                  <span style="color: var(--text-muted);">Doublons ignorés : <strong>${skipCount}</strong></span>
                  <span style="color: var(--color-danger);">Erreurs : <strong>${errorCount}</strong></span>
                </div>
                <button class="btn btn-primary" id="confirm-import-btn" style="width: 100%; margin-top: 10px;">
                  Confirmer et importer ${createCount} élève(s)
                </button>
              </div>
            `;

            const confirmBtn = previewZone.querySelector('#confirm-import-btn');
            if (confirmBtn) {
              confirmBtn.addEventListener('click', async () => {
                const result = await executeImportTransaction(previewRows, file.name);
                showToast(`Importation terminée : ${result.created} créés, ${result.skipped} ignorés.`);
                previewZone.innerHTML = '';
                this.options.onRefreshNeeded();
              });
            }
          }
        } catch (err) {
          console.error(err);
          showToast('Erreur lors de la lecture du fichier.');
        }
      });
    }

    // Gestion des années (suppression & ajout)
    const deleteYearBtns = this.container.querySelectorAll<HTMLButtonElement>('.param-delete-year-btn');
    deleteYearBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const yr = btn.dataset.year;
        if (yr) {
          const nextYears = yearsList.filter((y) => y !== yr);
          await setYearsList(nextYears);
          await this.loadDataAndRender();
        }
      });
    });

    const addYearBtn = this.container.querySelector('#param-add-year-btn');
    const addYearInput = this.container.querySelector<HTMLInputElement>('#param-add-year-input');
    if (addYearBtn && addYearInput) {
      addYearBtn.addEventListener('click', async () => {
        const newYr = addYearInput.value.trim();
        if (newYr && !yearsList.includes(newYr)) {
          yearsList.push(newYr);
          await setYearsList(yearsList);
          await this.loadDataAndRender();
        }
      });
    }

    // Sauvegarde JSON
    const backupBtn = this.container.querySelector('#param-backup-json-btn');
    if (backupBtn) {
      backupBtn.addEventListener('click', async () => {
        const students = await getAllStudents();
        const attendances = await getAllAttendances();
        const backupData = {
          version: 1,
          date: new Date().toISOString(),
          students,
          attendances,
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sauvegarde_presences_${getTodayBrussels()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Sauvegarde JSON générée.');
      });
    }

    // Restauration JSON
    const restoreInput = this.container.querySelector<HTMLInputElement>('#param-restore-file');
    if (restoreInput) {
      restoreInput.addEventListener('change', async () => {
        const file = restoreInput.files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          if (data.students && Array.isArray(data.students)) {
            await db.transaction('rw', [db.students, db.attendances], async () => {
              for (const s of data.students) {
                await db.students.put({ ...s, dirty: 1 });
              }
              if (data.attendances && Array.isArray(data.attendances)) {
                for (const a of data.attendances) {
                  await db.attendances.put({ ...a, dirty: 1 });
                }
              }
            });
            showToast('Restauration des données réussie !');
            this.options.onRefreshNeeded();
          }
        } catch {
          showToast('Fichier de sauvegarde invalide.');
        }
      });
    }

    // Génération du jeu de démonstration
    const seedBtn = this.container.querySelector('#param-seed-demo-btn');
    if (seedBtn) {
      seedBtn.addEventListener('click', async () => {
        showToast('Génération de 200 élèves et 3 mois d\'historique...');
        await this.generateDemoData();
        showToast('Jeu de démonstration créé avec succès !');
        this.options.onRefreshNeeded();
      });
    }

    // Bouton de mise à jour PWA
    const updateBtn = this.container.querySelector('#param-update-app-btn');
    if (updateBtn) {
      updateBtn.addEventListener('click', () => {
        this.options.onUpdateAppClick();
      });
    }
  }

  private async generateDemoData(): Promise<void> {
    const years = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];
    await setYearsList(years);

    const firstNamesF = ['Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Lina', 'Léa', 'Rose', 'Mia', 'Anna', 'Manon', 'Julia', 'Inès', 'Camille', 'Sarah', 'Zoé', 'Eva', 'Lola', 'Victoire', 'Mathilde'];
    const firstNamesM = ['Gabriel', 'Léo', 'Raphaël', 'Maël', 'Louis', 'Noah', 'Jules', 'Adam', 'Lucas', 'Hugo', 'Arthur', 'Liam', 'Ethan', 'Paul', 'Tom', 'Sacha', 'Théo', 'Mathis', 'Antoine', 'Victor'];
    const lastNames = ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard'];

    const now = Date.now();
    const studentsCreated: StudentRecord[] = [];

    // Créer 200 élèves
    await db.transaction('rw', db.students, async () => {
      for (let i = 0; i < 200; i++) {
        const gender: 'F' | 'M' = i % 2 === 0 ? 'F' : 'M';
        const fnList = gender === 'F' ? firstNamesF : firstNamesM;
        const firstName = fnList[Math.floor(Math.random() * fnList.length)] + (i > 40 ? ` ${i}` : '');
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const year = years[i % years.length];

        const student = await createStudent({
          firstName,
          lastName,
          gender,
          year,
          active: true,
        });
        studentsCreated.push(student);
      }
    });

    // Générer 3 mois d'historique de présences (environ 30 jours de classe)
    const today = new Date();
    const deviceId = await getDeviceId();

    await db.transaction('rw', db.attendances, async () => {
      for (let d = 0; d < 90; d += 3) { // Tous les 3 jours
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - d);
        const dateStr = targetDate.toISOString().substring(0, 10);

        // Sélectionner 40 élèves au hasard pour chaque jour
        for (let j = 0; j < 40; j++) {
          const student = studentsCreated[Math.floor(Math.random() * studentsCreated.length)];
          const type: 'presence' | 'course' = Math.random() > 0.3 ? 'presence' : 'course';
          const markedAt = targetDate.getTime() + Math.floor(Math.random() * 28800000); // 8h de plage

          const id = buildAttendanceId(student.id, dateStr, type);
          await db.attendances.put({
            id,
            studentId: student.id,
            date: dateStr,
            type,
            present: true,
            markedAt,
            deviceId,
            updatedAt: now,
            dirty: 1,
          });
        }
      }
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
