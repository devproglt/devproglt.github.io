import { db, type StudentRecord } from './schema';
export type { StudentRecord };
import { normalizeText, buildSearchKey } from '../domain/normalize';
import { generateUUID } from '../domain/ids';

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  gender: 'F' | 'M';
  year: string;
  isInternal?: boolean;
  notes?: string;
  active?: boolean;
}

export interface UpdateStudentInput {
  id: string;
  firstName?: string;
  lastName?: string;
  gender?: 'F' | 'M';
  year?: string;
  isInternal?: boolean;
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
    isInternal: input.isInternal !== undefined ? input.isInternal : false,
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
    isInternal: input.isInternal !== undefined ? input.isInternal : (existing.isInternal || false),
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
 * Désactive ou réactive un élève.
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
 * Supprime définitivement un élève et tous ses pointages associés.
 */
export async function deleteStudentPermanently(id: string): Promise<void> {
  await db.transaction('rw', [db.students, db.attendances], async () => {
    await db.students.delete(id);
    await db.attendances.where('studentId').equals(id).delete();
  });
}

/**
 * Supprime l'ensemble des élèves et tous les pointages (Remise à zéro complète).
 */
export async function clearAllStudentsAndData(): Promise<void> {
  await db.transaction('rw', [db.students, db.attendances, db.importLog, db.meta], async () => {
    await db.students.clear();
    await db.attendances.clear();
    await db.importLog.clear();
    await db.meta.delete('lastPullCursor');
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
 * Filtre les élèves selon la recherche, les années sélectionnées et le statut actif.
 */
export interface FilterStudentsOptions {
  query?: string;
  years?: string[];
  onlyActive?: boolean;
  initialLetter?: string;
}

export async function getFilteredStudents(options: FilterStudentsOptions = {}): Promise<StudentRecord[]> {
  let all = await db.students.toArray();

  if (options.onlyActive) {
    all = all.filter((s) => s.active);
  }

  if (options.years && options.years.length > 0 && !options.years.includes('all')) {
    const selectedLevels = options.years;
    all = all.filter((s) => {
      const yr = s.year.trim();
      return selectedLevels.some((lvl) => yr === lvl || yr.startsWith(lvl));
    });
  }

  if (options.query && options.query.trim()) {
    const normQuery = normalizeText(options.query);
    all = all.filter((s) => {
      const sk = s.searchKey || buildSearchKey(s.firstName || '', s.lastName || '');
      return sk.includes(normQuery);
    });
  }

  if (options.initialLetter && options.initialLetter !== 'ALL') {
    const initial = options.initialLetter.toUpperCase();
    all = all.filter((s) => {
      const fn = normalizeText(s.firstName || '').toUpperCase();
      const ln = normalizeText(s.lastName || '').toUpperCase();
      return fn.startsWith(initial) || ln.startsWith(initial);
    });
  }

  return all.sort((a, b) => {
    const fnComp = (a.firstName || '').localeCompare(b.firstName || '', 'fr', { sensitivity: 'base' });
    if (fnComp !== 0) return fnComp;
    return (a.lastName || '').localeCompare(b.lastName || '', 'fr', { sensitivity: 'base' });
  });
}

/**
 * Vérifie si un doublon probable existe déjà.
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

/**
 * Détecte et fusionne automatiquement les doublons (même prénom + nom).
 * Conserve l'élève le plus récent/canonique, réassocie les pointages et supprime le doublon.
 */
export async function deduplicateStudents(): Promise<number> {
  const all = await db.students.toArray();
  const groups = new Map<string, StudentRecord[]>();

  for (const s of all) {
    const key = `${normalizeText(s.firstName)}_${normalizeText(s.lastName)}`;
    const list = groups.get(key) || [];
    list.push(s);
    groups.set(key, list);
  }

  let mergedCount = 0;

  await db.transaction('rw', [db.students, db.attendances], async () => {
    for (const list of groups.values()) {
      if (list.length > 1) {
        // Priorité : actif d'abord, synchronisé (dirty = 0), puis plus récent updatedAt
        list.sort((a, b) => {
          if (a.active !== b.active) return a.active ? -1 : 1;
          if (a.dirty !== b.dirty) return a.dirty - b.dirty;
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        });

        const canonical = list[0];
        const duplicates = list.slice(1);

        for (const dup of duplicates) {
          // Réassocier tous les pointages du doublon vers l'élève canonique
          const attendances = await db.attendances.where('studentId').equals(dup.id).toArray();
          for (const att of attendances) {
            const cleanDate = att.date;
            const cleanType = att.type === 'course' ? 'course' : 'presence';
            const canonicalAttId = `${canonical.id}_${cleanDate}_${cleanType}`;
            const existingCanonicalAtt = await db.attendances.get(canonicalAttId);

            if (!existingCanonicalAtt) {
              await db.attendances.put({
                ...att,
                id: canonicalAttId,
                studentId: canonical.id,
                date: cleanDate,
                type: cleanType,
              });
            } else if (att.present && !existingCanonicalAtt.present) {
              await db.attendances.update(canonicalAttId, {
                present: true,
                updatedAt: Math.max(att.updatedAt || 0, existingCanonicalAtt.updatedAt || 0),
              });
            }
            await db.attendances.delete(att.id);
          }

          // Supprimer l'élève en double
          await db.students.delete(dup.id);
          mergedCount++;
        }
      }
    }
  });

  return mergedCount;
}
