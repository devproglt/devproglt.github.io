import { db, type StudentRecord } from '../db/schema';
import { normalizeText, buildSearchKey } from '../domain/normalize';
import { generateUUID } from '../domain/ids';
import { getYearsList, setYearsList } from '../db/meta';
import { addImportLog } from '../db/importLog';

export interface RawRow {
  [key: string]: any;
}

export interface NormalizedRow {
  rowIndex: number;
  lastName: string;
  firstName: string;
  gender: 'F' | 'M';
  year: string;
  isInternal: boolean;
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
  isInternalCol: string;
  notesCol: string;
}

/**
 * Charge dynamiquement SheetJS (xlsx) à la demande.
 */
export async function getXLSXModule(): Promise<typeof import('xlsx')> {
  return await import('xlsx');
}

/**
 * Extrait tous les en-têtes de colonnes d'une feuille Excel de manière robuste.
 * Recherche la première ligne contenant au moins 2 cellules non vides.
 */
export function extractHeadersFromWorksheet(XLSX: typeof import('xlsx'), worksheet: any): { headers: string[]; dataRows: RawRow[] } {
  const sheet2D: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!sheet2D || sheet2D.length === 0) {
    return { headers: [], dataRows: [] };
  }

  // Trouver la ligne d'en-tête (première ligne avec au moins 2 colonnes non vides)
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(sheet2D.length, 10); r++) {
    const row = sheet2D[r];
    const nonEmptyCount = row.filter((c: any) => String(c ?? '').trim().length > 0).length;
    if (nonEmptyCount >= 2) {
      headerRowIndex = r;
      break;
    }
  }

  const rawHeaderRow = sheet2D[headerRowIndex] || [];
  const headers: string[] = [];
  const seenHeaders = new Map<string, number>();

  for (let c = 0; c < rawHeaderRow.length; c++) {
    let headerName = String(rawHeaderRow[c] ?? '').trim();
    if (!headerName) {
      headerName = `Colonne ${c + 1}`;
    }
    const count = seenHeaders.get(headerName) || 0;
    seenHeaders.set(headerName, count + 1);
    if (count > 0) {
      headers.push(`${headerName} (${count + 1})`);
    } else {
      headers.push(headerName);
    }
  }

  // Convertir les lignes de données en objets clé-valeur
  const dataRows: RawRow[] = [];
  for (let r = headerRowIndex + 1; r < sheet2D.length; r++) {
    const row = sheet2D[r];
    if (!row || row.every((val: any) => String(val ?? '').trim() === '')) {
      continue; // Ignorer les lignes totalement vides
    }
    const rowObj: RawRow = {};
    for (let c = 0; c < headers.length; c++) {
      rowObj[headers[c]] = row[c] !== undefined ? row[c] : '';
    }
    dataRows.push(rowObj);
  }

  return { headers, dataRows };
}

/**
 * Pré-détecte automatiquement la meilleure correspondance des colonnes d'après les en-têtes.
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  let lastNameCol = '';
  let firstNameCol = '';
  let genderCol = '';
  let yearCol = '';
  let isInternalCol = '';
  let notesCol = '';

  for (const h of headers) {
    const norm = normalizeText(h);
    if (['nom', 'nom de famille', 'last name', 'lastname', 'nom famille'].includes(norm) && !lastNameCol) {
      lastNameCol = h;
    } else if (['prenom', 'first name', 'firstname'].includes(norm) && !firstNameCol) {
      firstNameCol = h;
    } else if (['sexe', 'genre', 'f/m', 'g/f', 'gender', 's'].includes(norm) && !genderCol) {
      genderCol = h;
    } else if (['annee', 'classe', 'niveau', 'year', 'groupe', 'section', 'degre', 'degre/annee'].includes(norm) && !yearCol) {
      yearCol = h;
    } else if (['interne', 'estinterne', 'est interne', 'pensionnaire', 'regime', 'internat'].includes(norm) && !isInternalCol) {
      isInternalCol = h;
    } else if (['remarque', 'notes', 'commentaire', 'remark', 'observation'].includes(norm) && !notesCol) {
      notesCol = h;
    }
  }

  // Recherche par mot-clé si non trouvé
  if (!lastNameCol) lastNameCol = headers.find((h) => normalizeText(h).includes('nom') && !normalizeText(h).includes('prenom')) || headers[0] || '';
  if (!firstNameCol) firstNameCol = headers.find((h) => normalizeText(h).includes('prenom')) || (headers.length > 1 ? headers[1] : '') || '';
  if (!genderCol) genderCol = headers.find((h) => ['sexe', 'genre'].some((k) => normalizeText(h).includes(k))) || '';
  if (!yearCol) yearCol = headers.find((h) => ['annee', 'classe', 'niveau'].some((k) => normalizeText(h).includes(k))) || '';
  if (!isInternalCol) isInternalCol = headers.find((h) => ['interne', 'pension'].some((k) => normalizeText(h).includes(k))) || '';

  return { lastNameCol, firstNameCol, genderCol, yearCol, isInternalCol, notesCol };
}

/**
 * Normalise la valeur du sexe en 'F' ou 'M'.
 */
export function normalizeGender(val: any): 'F' | 'M' {
  if (val === undefined || val === null || val === '') return 'F';
  const str = normalizeText(String(val));
  if (['f', 'fille', 'feminin', 'féminin', 'female', '2'].includes(str)) return 'F';
  if (['m', 'g', 'garcon', 'garçon', 'masculin', 'male', '1', 'h', 'homme'].includes(str)) return 'M';
  return 'F';
}

/**
 * Normalise la valeur d'EstInterne en boolean.
 */
export function normalizeBoolean(val: any): boolean {
  if (val === undefined || val === null || val === '') return false;
  if (typeof val === 'boolean') return val;
  const str = normalizeText(String(val));
  return ['oui', 'true', '1', 'x', 'o', 'y', 'interne', 'vrai', 'pensionnaire'].includes(str);
}

/**
 * Analyse les lignes brutes Excel avec le mapping choisi par l'utilisateur.
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

    let lastName = mapping.lastNameCol ? String(row[mapping.lastNameCol] ?? '').trim() : '';
    let firstName = mapping.firstNameCol ? String(row[mapping.firstNameCol] ?? '').trim() : '';
    const genderRaw = mapping.genderCol ? row[mapping.genderCol] : null;
    let year = mapping.yearCol ? String(row[mapping.yearCol] ?? '').trim() : '';
    const isInternalRaw = mapping.isInternalCol ? row[mapping.isInternalCol] : null;
    const notes = mapping.notesCol ? String(row[mapping.notesCol] ?? '').trim() : '';

    // Si aucune donnée dans la ligne
    if (!lastName && !firstName && !year) continue;

    if (!firstName && lastName) {
      // Si une seule colonne Nom/Prénom a été fournie, séparer si possible
      const parts = lastName.split(/\s+/);
      if (parts.length > 1) {
        lastName = parts[0];
        firstName = parts.slice(1).join(' ');
      } else {
        firstName = lastName;
        lastName = 'Élève';
      }
    } else if (!lastName && firstName) {
      lastName = 'Élève';
    }

    const gender = normalizeGender(genderRaw);
    if (!year) {
      year = '1A';
    }

    const isInternal = normalizeBoolean(isInternalRaw);

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
          isInternal,
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
          isInternal,
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
        isInternal,
        notes,
        status: 'create',
      });
    }
  }

  return results;
}

/**
 * Exécute l'importation dans Dexie (Inclut db.meta pour éviter les erreurs de transaction).
 */
export async function executeImportTransaction(
  previewRows: NormalizedRow[],
  fileName: string
): Promise<{ created: number; updated: number; skipped: number }> {
  const now = Date.now();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Récupérer et mettre à jour les années scolaires
  const currentYears = await getYearsList();
  const yearSet = new Set(currentYears);
  for (const r of previewRows) {
    if (r.year && r.year.trim()) {
      yearSet.add(r.year.trim());
    }
  }
  await setYearsList(Array.from(yearSet));

  // Transaction Dexie avec TOUTES les tables nécessaires
  await db.transaction('rw', [db.students, db.importLog, db.meta], async () => {
    for (const row of previewRows) {
      if (row.status === 'skip' || row.status === 'error') {
        skipped++;
        continue;
      }

      if (row.status === 'create') {
        const id = generateUUID();
        const student: StudentRecord = {
          id,
          firstName: row.firstName,
          lastName: row.lastName,
          gender: row.gender,
          year: row.year,
          active: true,
          isInternal: row.isInternal,
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
            gender: row.gender,
            year: row.year,
            isInternal: row.isInternal,
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
    { Nom: 'DUPONT', Prénom: 'Alice', Sexe: 'F', Année: '1A', EstInterne: 'Oui', Remarque: 'Exemple' },
    { Nom: 'MARTIN', Prénom: 'Lucas', Sexe: 'M', Année: '2B', EstInterne: 'Non', Remarque: 'Exemple' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');
  XLSX.writeFile(workbook, 'modele_import_eleves.xlsx');
}
