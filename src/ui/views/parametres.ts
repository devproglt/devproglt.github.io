import { STRINGS } from '../strings';
import { showToast } from '../components/toast';
import { openImportMappingModal } from '../components/import-modal';
import { getMeta, setMeta, getDeviceId, getAllowMultipleSessionsPerDay, setAllowMultipleSessionsPerDay } from '../../db/meta';
import { SyncEngine } from '../../sync/engine';
import { downloadImportTemplate } from '../../io/import';
import { getAllStudents, clearAllStudentsAndData, deduplicateStudents } from '../../db/students';
import { getAllAttendances, clearAllAttendances, normalizeAndRepairAttendances } from '../../db/attendances';
import { deduplicateEvents } from '../../db/events';
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
    const allowMultipleSessions = await getAllowMultipleSessionsPerDay();

    const engine = SyncEngine.getInstance();
    const pendingCount = await engine.getPendingCount();

    const lastSyncStr = lastSyncAt ? new Date(lastSyncAt).toLocaleString('fr-BE') : 'Jamais';

    this.container.innerHTML = `
      <div style="padding: 16px; display: flex; flex-direction: column; gap: 20px;">
        <h2>${STRINGS.nav.parametres}</h2>

        <!-- Options de séances -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 10px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Séances & Entraînements</h3>
          
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: var(--font-size-sm); color: var(--text-primary);">
            <input type="checkbox" id="param-allow-multiple-sessions" ${allowMultipleSessions ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent-active);" />
            <span>Autoriser plusieurs séances du même type par jour</span>
          </label>
          <span style="font-size: var(--font-size-xs); color: var(--text-muted); margin-top: -4px;">
            Si désactivé (recommandé), un seul entraînement et une seule course peuvent exister par date pour éviter les doublons accidentels.
          </span>
        </section>

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

          <button class="btn btn-secondary" id="param-force-sync-btn" style="width: 100%; border-color: var(--accent-presence); color: var(--accent-presence); margin-top: 4px;">
            Forcer le rechargement complet (Télécharger tout le Sheet)
          </button>

          <button class="btn btn-secondary" id="param-clean-duplicates-btn" style="width: 100%; margin-top: 4px;">
            Nettoyer et fusionner les doublons (Élèves, Présences & Séances)
          </button>
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
              ${STRINGS.actions.downloadTemplate}
            </button>
          </div>
        </section>

        <!-- Sauvegarde Locale et Restauration -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Sauvegarde & Restauration (.json)</h3>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="param-backup-json-btn" style="flex: 1;">
              ${STRINGS.actions.backupJson}
            </button>
            <label class="btn btn-secondary" style="flex: 1; cursor: pointer;">
              ${STRINGS.actions.restoreJson}
              <input type="file" id="param-restore-file" accept=".json" style="display: none;" />
            </label>
          </div>
        </section>

        <!-- Mise à jour de l'application -->
        <section style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700;">Version de l'application</h3>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">PWA Standalone (Hors ligne)</span>
            <button class="btn btn-secondary" id="param-update-app-btn" style="min-height: 38px; padding: 0 12px; font-size: 0.8rem;">
              ${STRINGS.actions.updateApp}
            </button>
          </div>
        </section>

        <!-- Zone de Danger : Remise à zéro et nouvelle année scolaire -->
        <section style="background: var(--bg-surface); border: 1px solid var(--color-danger); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="font-size: var(--font-size-base); font-weight: 700; color: var(--color-danger);">
            Zone de Danger (Nouvelle année scolaire / Nettoyage)
          </h3>
          <p style="font-size: var(--font-size-xs); color: var(--text-secondary);">
            Ces actions effacent définitivement les données locales de votre appareil :
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-secondary" id="param-clear-attendances-btn" style="border-color: var(--color-warning); color: var(--color-warning);">
              Effacer tous les pointages (Garder les élèves)
            </button>
            <button class="btn btn-danger" id="param-clear-all-btn">
              Réinitialiser TOUTE la base de données (Élèves & Présences)
            </button>
          </div>
        </section>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const saveSyncBtn = this.container.querySelector('#param-save-sync-btn');
    if (saveSyncBtn) {
      saveSyncBtn.addEventListener('click', async () => {
        const urlInput = this.container.querySelector<HTMLInputElement>('#param-sync-url');
        const tokenInput = this.container.querySelector<HTMLInputElement>('#param-sync-token');
        const deviceInput = this.container.querySelector<HTMLInputElement>('#param-device-name');

        const url = urlInput ? urlInput.value.trim() : '';
        const token = tokenInput ? tokenInput.value.trim() : '';
        const device = deviceInput ? deviceInput.value.trim() : '';

        if (!url || !token) {
          showToast('Veuillez renseigner l\'URL et le jeton de sécurité.');
          return;
        }

        await setMeta('syncUrl', url);
        await setMeta('syncToken', token);
        if (device) await setMeta('deviceId', device);

        showToast('Paramètres de synchronisation enregistrés.');
        this.options.onRefreshNeeded();
      });
    }

    const syncNowBtn = this.container.querySelector('#param-sync-now-btn');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', async () => {
        const urlInput = this.container.querySelector<HTMLInputElement>('#param-sync-url');
        const tokenInput = this.container.querySelector<HTMLInputElement>('#param-sync-token');
        const deviceInput = this.container.querySelector<HTMLInputElement>('#param-device-name');

        const url = urlInput ? urlInput.value.trim() : '';
        const token = tokenInput ? tokenInput.value.trim() : '';
        const device = deviceInput ? deviceInput.value.trim() : '';

        if (!url || !token) {
          showToast('Veuillez renseigner l\'URL et le jeton de sécurité ci-dessus.');
          return;
        }

        // Sauvegarde automatique des champs avant lancement
        await setMeta('syncUrl', url);
        await setMeta('syncToken', token);
        if (device) await setMeta('deviceId', device);

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

    const forceSyncBtn = this.container.querySelector('#param-force-sync-btn');
    if (forceSyncBtn) {
      forceSyncBtn.addEventListener('click', async () => {
        const urlInput = this.container.querySelector<HTMLInputElement>('#param-sync-url');
        const tokenInput = this.container.querySelector<HTMLInputElement>('#param-sync-token');
        const deviceInput = this.container.querySelector<HTMLInputElement>('#param-device-name');

        const url = urlInput ? urlInput.value.trim() : '';
        const token = tokenInput ? tokenInput.value.trim() : '';
        const device = deviceInput ? deviceInput.value.trim() : '';

        if (!url || !token) {
          showToast('Veuillez renseigner l\'URL et le jeton de sécurité ci-dessus.');
          return;
        }

        await setMeta('syncUrl', url);
        await setMeta('syncToken', token);
        if (device) await setMeta('deviceId', device);

        showToast('Rechargement complet du Sheet en cours...');
        const res = await SyncEngine.getInstance().triggerSync('manual_full', { forceFull: true });
        if (res.success) {
          showToast(`Rechargement réussi (${res.pulledCount || 0} éléments reçus) !`);
          await this.loadDataAndRender();
          this.options.onRefreshNeeded();
        } else {
          showToast(res.message || STRINGS.sync.syncError);
        }
      });
    }

    const allowMultipleCb = this.container.querySelector<HTMLInputElement>('#param-allow-multiple-sessions');
    if (allowMultipleCb) {
      allowMultipleCb.addEventListener('change', async () => {
        const isChecked = allowMultipleCb.checked;
        await setAllowMultipleSessionsPerDay(isChecked);
        if (!isChecked) {
          const mergedEvents = await deduplicateEvents();
          if (mergedEvents > 0) {
            showToast(`Option enregistrée : ${mergedEvents} séance(s) en double fusionnée(s).`);
          } else {
            showToast('Option enregistrée : séance unique par jour activée.');
          }
        } else {
          showToast('Option enregistrée : séances multiples par jour autorisées.');
        }
        this.options.onRefreshNeeded();
      });
    }

    const cleanDupBtn = this.container.querySelector('#param-clean-duplicates-btn');
    if (cleanDupBtn) {
      cleanDupBtn.addEventListener('click', async () => {
        showToast('Analyse et fusion des doublons...');
        const mergedStudents = await deduplicateStudents();
        const mergedEvents = await deduplicateEvents();
        const repairedAttendances = await normalizeAndRepairAttendances();
        showToast(`Nettoyage terminé : ${mergedStudents} élève(s), ${mergedEvents} séance(s), ${repairedAttendances} pointage(s) fusionnés/réparés !`);
        await this.loadDataAndRender();
        this.options.onRefreshNeeded();
      });
    }

    const templateBtn = this.container.querySelector('#param-download-template-btn');
    if (templateBtn) {
      templateBtn.addEventListener('click', async () => {
        await downloadImportTemplate();
      });
    }

    // Modal interactive de mapping d'importation Excel
    const importFileInput = this.container.querySelector<HTMLInputElement>('#param-import-file');

    if (importFileInput) {
      importFileInput.addEventListener('change', () => {
        const file = importFileInput.files?.[0];
        if (!file) return;

        openImportMappingModal({
          file,
          onSuccess: async () => {
            await this.loadDataAndRender();
            this.options.onRefreshNeeded();
          },
          onClose: () => {
            importFileInput.value = '';
          },
        });
      });
    }

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

    const updateBtn = this.container.querySelector('#param-update-app-btn');
    if (updateBtn) {
      updateBtn.addEventListener('click', () => {
        this.options.onUpdateAppClick();
      });
    }

    // Effacer uniquement les pointages
    const clearAttendancesBtn = this.container.querySelector('#param-clear-attendances-btn');
    if (clearAttendancesBtn) {
      clearAttendancesBtn.addEventListener('click', async () => {
        if (confirm('Voulez-vous vraiment effacer TOUS les pointages de présence et de course ? Les élèves seront conservés.')) {
          await clearAllAttendances();
          showToast('Tous les pointages ont été effacés.');
          this.options.onRefreshNeeded();
        }
      });
    }

    // Réinitialiser toute la base (Élèves & Pointages)
    const clearAllBtn = this.container.querySelector('#param-clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', async () => {
        if (confirm('ATTENTION : Voulez-vous vraiment TOUT réinitialiser (effacer TOUS les élèves et TOUS les pointages) ?')) {
          if (confirm('Confirmation finale : cette action est irréversible. Continuer ?')) {
            await clearAllStudentsAndData();
            showToast('La base de données a été totalement réinitialisée.');
            await this.loadDataAndRender();
            this.options.onRefreshNeeded();
          }
        }
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
