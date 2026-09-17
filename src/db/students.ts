import { db, type StudentRecord } from './schema';
export type { StudentRecord };
import { normalizeText, buildSearchKey } from '../domain/normalize';
import { generateUUID } from '../domain/ids';

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  gender: 'F' | 'M';
  year: string;
  notes?: string;
  active?: boolean;
}

export interface UpdateStudentInput {
  id: string;
  firstName?: string;
  lastName?: string;
  gender?: 'F' | 'M';
  year?: string;
  notes?: string;
  active?: boolean;
}

/**
 * Crée un nouvel élève en base locale.
 */
export async function createStudent(input: CreateStudentInput): Promise<StudentRecord> {
  const now = Date.now();
  const id = generateUUID();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  const student: StudentRecord = {
    id,
    firstName,
    lastName,
    gender: input.gender,
    year: input.year.trim(),
    active: input.active !== undefined ? input.active : true,
    notes: (input.notes || '').trim(),
    createdAt: new Date(now).toISOString(),
    updatedAt: now,
    dirty: 1,
    searchKey: buildSearchKey(firstName, lastName),
  };

  await db.students.put(student);
  return student;
}

/**
 * Met à jour un élève existant.
 */
export async function updateStudent(input: UpdateStudentInput): Promise<StudentRecord> {
  const existing = await db.students.get(input.id);
  if (!existing) {
    throw new Error(`Élève introuvable pour l'identifiant ${input.id}`);
  }

  const now = Date.now();
  const firstName = input.firstName !== undefined ? input.firstName.trim() : existing.firstName;
  const lastName = input.lastName !== undefined ? input.lastName.trim() : existing.lastName;

  const updated: StudentRecord = {
    ...existing,
    firstName,
    lastName,
    gender: input.gender !== undefined ? input.gender : existing.gender,
    year: input.year !== undefined ? input.year.trim() : existing.year,
    notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
    active: input.active !== undefined ? input.active : existing.active,
    updatedAt: now,
    dirty: 1,
    searchKey: buildSearchKey(firstName, lastName),
  };

  await db.students.put(updated);
  return updated;
}

/**
 * Désactive un élève (désactivation logique au lieu de suppression physique).
 */
export async function toggleStudentActive(id: string, active: boolean): Promise<void> {
  const now = Date.now();
  await db.students.update(id, {
    active,
    updatedAt: now,
    dirty: 1,
  });
}

/**
 * Récupère un élève par son ID.
 */
export async function getStudentById(id: string): Promise<StudentRecord | undefined> {
  return await db.students.get(id);
}

/**
 * Récupère tous les élèves.
 */
export async function getAllStudents(): Promise<StudentRecord[]> {
  return await db.students.toArray();
}

/**
 * Filtre les élèves selon la recherche, les années sélectionnées, l'initiale du prénom et le statut actif.
 */
export interface FilterStudentsOptions {
  query?: string;
  years?: string[]; // Si vide ou contient 'all', pas de filtre par année
  initialLetter?: string; // Lettre majuscule A-Z
  onlyActive?: boolean;
}

export async function getFilteredStudents(options: FilterStudentsOptions = {}): Promise<StudentRecord[]> {
  let all = await db.students.toArray();

  if (options.onlyActive) {
    all = all.filter((s) => s.active);
  }

  if (options.years && options.years.length > 0 && !options.years.includes('all')) {
    const setYears = new Set(options.years);
    all = all.filter((s) => setYears.has(s.year));
  }

  if (options.query && options.query.trim()) {
    const normQuery = normalizeText(options.query);
    all = all.filter((s) => s.searchKey.includes(normQuery));
  }

  if (options.initialLetter && options.initialLetter !== 'ALL') {
    const letter = normalizeText(options.initialLetter);
    all = all.filter((s) => {
      const fnNorm = normalizeText(s.firstName);
      return fnNorm.startsWith(letter);
    });
  }

  // Tri par prénom puis par nom
  return all.sort((a, b) => {
    const fnComp = a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' });
    if (fnComp !== 0) return fnComp;
    return a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' });
  });
}

/**
 * Vérifie si un doublon probable existe déjà (même prénom, nom et année normalisés).
 */
export async function checkProbableDuplicate(
  firstName: string,
  lastName: string,
  year: string,
  excludeId?: string
): Promise<boolean> {
  const normFn = normalizeText(firstName);
  const normLn = normalizeText(lastName);
  const normYr = year.trim();

  const all = await db.students.toArray();
  return all.some((s) => {
    if (excludeId && s.id === excludeId) return false;
    return (
      normalizeText(s.firstName) === normFn &&
      normalizeText(s.lastName) === normLn &&
      s.year.trim() === normYr
    );
  });
}

/**
 * Récupère les élèves non synchronisés (dirty == 1).
 */
export async function getDirtyStudents(): Promise<StudentRecord[]> {
  return await db.students.where('dirty').equals(1).toArray();
}

/**
 * Marque des élèves comme synchronisés (dirty = 0).
 */
export async function markStudentsSynced(ids: string[]): Promise<void> {
  await db.transaction('rw', db.students, async () => {
    for (const id of ids) {
      await db.students.update(id, { dirty: 0 });
    }
  });
}
