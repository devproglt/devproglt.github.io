import { STRINGS } from '../strings';
import { showToast } from './toast';
import {
  getXLSXModule,
  extractHeadersFromWorksheet,
  detectColumnMapping,
  parseAndPreviewImport,
  executeImportTransaction,
  type ColumnMapping,
  type NormalizedRow,
} from '../../io/import';
import { getFilteredStudents } from '../../db/students';

export interface ImportModalOptions {
  file: File;
  onSuccess: () => void;
  onClose: () => void;
}

export async function openImportMappingModal(options: ImportModalOptions): Promise<void> {
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-overlay';
  document.body.appendChild(modalContainer);

  const close = () => {
    modalContainer.remove();
    options.onClose();
  };

  try {
    showToast('Lecture du fichier Excel...');
    const XLSX = await getXLSXModule();
    const buffer = await options.file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Extraction exhaustive de TOUTES les colonnes du fichier Excel
    const { headers, dataRows } = extractHeadersFromWorksheet(XLSX, worksheet);

    if (headers.length === 0 || dataRows.length === 0) {
      showToast('Fichier Excel vide ou aucune donnée trouvée.');
      close();
      return;
    }

    let mapping: ColumnMapping = detectColumnMapping(headers);

    const renderMappingStep = () => {
      // Générateur d'options pour les listes déroulantes contenant TOUTES les colonnes du fichier
      const renderDropdownOptions = (selected: string, isRequired = false) => {
        let html = `<option value="" ${!selected ? 'selected' : ''}>${isRequired ? '-- Choisir une colonne --' : '(Aucune / Non renseigné)'}</option>`;
        html += headers
          .map(
            (h) => `
          <option value="${escapeHtml(h)}" ${selected === h ? 'selected' : ''}>${escapeHtml(h)}</option>
        `
          )
          .join('');
        return html;
      };

      modalContainer.innerHTML = `
        <div class="modal-content" style="max-width: 580px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Correspondance des colonnes (${escapeHtml(options.file.name)})
            </h3>
            <button class="btn btn-secondary" id="import-close-btn" style="min-height: 36px; padding: 0 10px;">✕</button>
          </div>

          <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: 16px;">
            ${headers.length} colonnes et ${dataRows.length} lignes détectées. Associez les colonnes de votre fichier aux champs de l'application :
          </p>

          <form id="import-mapping-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                1. Colonne pour le NOM de famille *
              </label>
              <select id="map-lastname" class="search-input" style="appearance: auto;" required>
                ${renderDropdownOptions(mapping.lastNameCol, true)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                2. Colonne pour le PRÉNOM
              </label>
              <select id="map-firstname" class="search-input" style="appearance: auto;">
                ${renderDropdownOptions(mapping.firstNameCol, false)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                3. Colonne pour la CLASSE / ANNÉE
              </label>
              <select id="map-year" class="search-input" style="appearance: auto;">
                ${renderDropdownOptions(mapping.yearCol, false)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                4. Colonne pour le SEXE (F / M)
              </label>
              <select id="map-gender" class="search-input" style="appearance: auto;">
                ${renderDropdownOptions(mapping.genderCol, false)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                5. Colonne pour le statut INTERNE (EstInterne)
              </label>
              <select id="map-internal" class="search-input" style="appearance: auto;">
                ${renderDropdownOptions(mapping.isInternalCol, false)}
              </select>
            </div>

            <div>
              <label style="font-size: var(--font-size-xs); font-weight: 700; display: block; margin-bottom: 4px;">
                6. Colonne pour les REMARQUES / NOTES
              </label>
              <select id="map-notes" class="search-input" style="appearance: auto;">
                ${renderDropdownOptions(mapping.notesCol, false)}
              </select>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 16px;">
              <button type="button" class="btn btn-secondary" id="import-cancel-btn" style="flex: 1;">
                ${STRINGS.actions.cancel}
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1.5;">
                Valider et afficher l'aperçu →
              </button>
            </div>
          </form>
        </div>
      `;

      const closeBtn = modalContainer.querySelector('#import-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', close);

      const cancelBtn = modalContainer.querySelector('#import-cancel-btn');
      if (cancelBtn) cancelBtn.addEventListener('click', close);

      const form = modalContainer.querySelector<HTMLFormElement>('#import-mapping-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const lastNameCol = (modalContainer.querySelector<HTMLSelectElement>('#map-lastname')?.value || '').trim();
          const firstNameCol = (modalContainer.querySelector<HTMLSelectElement>('#map-firstname')?.value || '').trim();
          const yearCol = (modalContainer.querySelector<HTMLSelectElement>('#map-year')?.value || '').trim();
          const genderCol = (modalContainer.querySelector<HTMLSelectElement>('#map-gender')?.value || '').trim();
          const isInternalCol = (modalContainer.querySelector<HTMLSelectElement>('#map-internal')?.value || '').trim();
          const notesCol = (modalContainer.querySelector<HTMLSelectElement>('#map-notes')?.value || '').trim();

          mapping = { lastNameCol, firstNameCol, genderCol, yearCol, isInternalCol, notesCol };

          const existingStudents = await getFilteredStudents();
          const previewRows = await parseAndPreviewImport(dataRows, mapping, 'ignore', existingStudents);

          renderPreviewStep(previewRows);
        });
      }
    };

    const renderPreviewStep = (previewRows: NormalizedRow[]) => {
      const createCount = previewRows.filter((r) => r.status === 'create').length;
      const skipCount = previewRows.filter((r) => r.status === 'skip').length;

      const sampleRows = previewRows.slice(0, 8);

      modalContainer.innerHTML = `
        <div class="modal-content" style="max-width: 620px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-size: var(--font-size-lg); font-weight: 700;">
              Aperçu de l'import (${createCount} à créer)
            </h3>
            <button class="btn btn-secondary" id="import-close-btn2" style="min-height: 36px; padding: 0 10px;">✕</button>
          </div>

          <div style="font-size: var(--font-size-xs); display: flex; gap: 14px; margin-bottom: 12px; background: var(--bg-surface-hover); padding: 8px 12px; border-radius: var(--radius-sm);">
            <span style="color: var(--color-success);">Nouveaux élèves à créer : <strong>${createCount}</strong></span>
            <span style="color: var(--text-muted);">Doublons déjà en base : <strong>${skipCount}</strong></span>
          </div>

          <div style="overflow-x: auto; max-height: 250px; margin-bottom: 16px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Classe</th>
                  <th>Sexe</th>
                  <th>Interne</th>
                </tr>
              </thead>
              <tbody>
                ${sampleRows.length === 0 ? `
                  <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Aucune ligne valide à importer.</td></tr>
                ` : sampleRows.map((r) => `
                  <tr style="${r.status === 'skip' ? 'opacity: 0.5;' : ''}">
                    <td><strong>${escapeHtml(r.lastName)}</strong></td>
                    <td>${escapeHtml(r.firstName)}</td>
                    <td><span class="badge-year">${escapeHtml(r.year)}</span></td>
                    <td>${r.gender}</td>
                    <td>${r.isInternal ? 'Oui' : 'Non'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${previewRows.length > 8 ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; text-align: center;">... et ${previewRows.length - 8} autres élèves.</p>` : ''}
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="import-back-mapping-btn" style="flex: 1;">
              ← Modifier les colonnes
            </button>
            <button class="btn btn-primary" id="import-confirm-btn" style="flex: 1.5;" ${createCount === 0 ? 'disabled' : ''}>
              Confirmer l'importation (${createCount})
            </button>
          </div>
        </div>
      `;

      const closeBtn2 = modalContainer.querySelector('#import-close-btn2');
      if (closeBtn2) closeBtn2.addEventListener('click', close);

      const backBtn = modalContainer.querySelector('#import-back-mapping-btn');
      if (backBtn) backBtn.addEventListener('click', renderMappingStep);

      const confirmBtn = modalContainer.querySelector<HTMLButtonElement>('#import-confirm-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Importation en cours...';
          try {
            const result = await executeImportTransaction(previewRows, options.file.name);
            showToast(`Importation réussie : ${result.created} élève(s) ajouté(s) !`);
            close();
            options.onSuccess();
          } catch (err: any) {
            console.error('[Import Error]:', err);
            showToast(`Erreur lors de l'enregistrement : ${err?.message || 'Transaction échouée'}`);
            confirmBtn.disabled = false;
            confirmBtn.textContent = `Confirmer l'importation (${createCount})`;
          }
        });
      }
    };

    renderMappingStep();
  } catch (err) {
    console.error(err);
    showToast('Erreur lors de la lecture du fichier Excel.');
    close();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
