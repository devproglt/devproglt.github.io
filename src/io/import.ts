import { db, type StudentRecord } from '../db/schema';
import { normalizeText, buildSearchKey } from '../domain/normalize';
import { generateUUID } from '../domain/ids';
import { addYearIfMissing } from '../db/meta';
import { addImportLog } from '../db/importLog';

export interface RawRow {
  [key: string]: any;
}

export interface NormalizedRow {
  rowIndex: number;
  lastName: string;
  firstName: string;
  gender: 'F' | 'M' | null;
  year: string;
  notes: string;
  status: 'create' | 'update' | 'skip' | 'error';
  errorReason?: string;
  existingId?: string;
}

export interface ColumnMapping {
  lastNameCol: string;
  firstNameCol: string;
  genderCol: string;
  yearCol: string;
  notesCol: string;
}

/**
 * Charge dynamiquement SheetJS (xlsx) pour économiser la taille du bundle initial.
 */
export async function getXLSXModule(): Promise<typeof import('xlsx')> {
  return await import('xlsx');
}

/**
 * Détecte les colonnes automatiquement depuis les en-têtes.
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  let lastNameCol = '';
  let firstNameCol = '';
  let genderCol = '';
  let yearCol = '';
  let notesCol = '';

  for (const h of headers) {
    const norm = normalizeText(h);
    if (['nom', 'nom de famille', 'last name', 'lastname'].includes(norm) && !lastNameCol) {
      lastNameCol = h;
    } else if (['prenom', 'first name', 'firstname'].includes(norm) && !firstNameCol) {
      firstNameCol = h;
    } else if (['sexe', 'genre', 'f/m', 'g/f', 'gender'].includes(norm) && !genderCol) {
      genderCol = h;
    } else if (['annee', 'classe', 'niveau', 'year'].includes(norm) && !yearCol) {
      yearCol = h;
    } else if (['remarque', 'notes', 'commentaire', 'remark'].includes(norm) && !notesCol) {
      notesCol = h;
    }
  }

  // Si non trouvé par correspondance exacte, recherche partielle
  if (!lastNameCol) lastNameCol = headers.find((h) => normalizeText(h).includes('nom')) || headers[0] || '';
  if (!firstNameCol) firstNameCol = headers.find((h) => normalizeText(h).includes('prenom')) || headers[1] || '';
  if (!genderCol) genderCol = headers.find((h) => ['sexe', 'genre'].some((k) => normalizeText(h).includes(k))) || '';
  if (!yearCol) yearCol = headers.find((h) => ['annee', 'classe', 'niveau'].some((k) => normalizeText(h).includes(k))) || '';

  return { lastNameCol, firstNameCol, genderCol, yearCol, notesCol };
}

/**
 * Normalise la valeur du sexe en 'F' ou 'M'.
 */
export function normalizeGender(val: any): 'F' | 'M' | null {
  if (!val) return null;
  const str = normalizeText(String(val));
  if (['f', 'fille', 'feminin', 'féminin', 'female'].includes(str)) return 'F';
  if (['m', 'g', 'garcon', 'garçon', 'masculin', 'male'].includes(str)) return 'M';
  return null;
}

/**
 * Analyse les lignes du fichier Excel et simule l'import (Aperçu).
 */
export async function parseAndPreviewImport(
  rawRows: RawRow[],
  mapping: ColumnMapping,
  duplicateStrategy: 'ignore' | 'update',
  existingStudents: StudentRecord[]
): Promise<NormalizedRow[]> {
  const existingMap = new Map<string, StudentRecord>();
  for (const s of existingStudents) {
    const key = `${normalizeText(s.lastName)}_${normalizeText(s.firstName)}`;
    existingMap.set(key, s);
  }

  const results: NormalizedRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const lastName = String(row[mapping.lastNameCol] || '').trim();
    const firstName = String(row[mapping.firstNameCol] || '').trim();
    const genderRaw = row[mapping.genderCol];
    const year = String(row[mapping.yearCol] || '').trim();
    const notes = String(row[mapping.notesCol] || '').trim();

    // Lignes vides ignorées
    if (!lastName && !firstName) continue;

    const gender = normalizeGender(genderRaw);

    if (!lastName || !firstName) {
      results.push({
        rowIndex: i + 2,
        lastName,
        firstName,
        gender,
        year,
        notes,
        status: 'error',
        errorReason: 'Nom et prénom requis.',
      });
      continue;
    }

    if (!gender) {
      results.push({
        rowIndex: i + 2,
        lastName,
        firstName,
        gender: null,
        year,
        notes,
        status: 'error',
        errorReason: `Sexe invalide (${String(genderRaw || '')}).`,
      });
      continue;
    }

    if (!year) {
      results.push({
        rowIndex: i + 2,
        lastName,
        firstName,
        gender,
        year: '',
        notes,
        status: 'error',
        errorReason: 'Année manquante.',
      });
      continue;
    }

    const dupKey = `${normalizeText(lastName)}_${normalizeText(firstName)}`;
    const existing = existingMap.get(dupKey);

    if (existing) {
      if (duplicateStrategy === 'ignore') {
        results.push({
          rowIndex: i + 2,
          lastName,
          firstName,
          gender,
          year,
          notes,
          status: 'skip',
          errorReason: 'Doublon existant (ignoré).',
          existingId: existing.id,
        });
      } else {
        results.push({
          rowIndex: i + 2,
          lastName,
          firstName,
          gender,
          year,
          notes,
          status: 'update',
          existingId: existing.id,
        });
      }
    } else {
      results.push({
        rowIndex: i + 2,
        lastName,
        firstName,
        gender,
        year,
        notes,
        status: 'create',
      });
    }
  }

  return results;
}

/**
 * Exécute l'importation définitive en une seule transaction Dexie.
 */
export async function executeImportTransaction(
  previewRows: NormalizedRow[],
  fileName: string
): Promise<{ created: number; updated: number; skipped: number }> {
  const now = Date.now();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  await db.transaction('rw', [db.students, db.importLog], async () => {
    for (const row of previewRows) {
      if (row.status === 'skip' || row.status === 'error') {
        skipped++;
        continue;
      }

      await addYearIfMissing(row.year);

      if (row.status === 'create') {
        const id = generateUUID();
        const student: StudentRecord = {
          id,
          firstName: row.firstName,
          lastName: row.lastName,
          gender: row.gender!,
          year: row.year,
          active: true,
          notes: row.notes,
          createdAt: new Date(now).toISOString(),
          updatedAt: now,
          dirty: 1,
          searchKey: buildSearchKey(row.firstName, row.lastName),
        };
        await db.students.put(student);
        created++;
      } else if (row.status === 'update' && row.existingId) {
        const existing = await db.students.get(row.existingId);
        if (existing) {
          const updatedStudent: StudentRecord = {
            ...existing,
            gender: row.gender!,
            year: row.year,
            notes: row.notes || existing.notes,
            updatedAt: now,
            dirty: 1,
          };
          await db.students.put(updatedStudent);
          updated++;
        }
      }
    }

    await addImportLog(fileName, created, updated, skipped);
  });

  return { created, updated, skipped };
}

/**
 * Génère et télécharge le modèle Excel d'importation vierge.
 */
export async function downloadImportTemplate(): Promise<void> {
  const XLSX = await getXLSXModule();
  const templateData = [
    { Nom: 'DUPONT', Prénom: 'Alice', Sexe: 'F', Année: '1A', Remarque: 'Exemple' },
    { Nom: 'MARTIN', Prénom: 'Lucas', Sexe: 'M', Année: '2B', Remarque: 'Exemple' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');
  XLSX.writeFile(workbook, 'modele_import_eleves.xlsx');
}
