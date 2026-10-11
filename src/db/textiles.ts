import { db, type TextileTypeRecord, type TextileDistributionRecord } from './schema';
export type { TextileTypeRecord, TextileDistributionRecord };
import { generateUUID } from '../domain/ids';
import { getTodayBrussels, formatDateBrussels } from '../domain/dates';

/**
  * Récupère tous les types de textiles ordonnés par nom.
  */
export async function getTextileTypes(): Promise<TextileTypeRecord[]> {
  const types = await db.textileTypes.toArray();
  return types.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/**
  * Crée un nouveau type de textile (ex: "T-shirt", "Veste", "Short").
  */
export async function createTextileType(name: string, id?: string): Promise<TextileTypeRecord> {
  const cleanName = name.trim();
  const typeId = id || generateUUID();
  const now = Date.now();

  const record: TextileTypeRecord = {
    id: typeId,
    name: cleanName,
    createdAt: new Date().toISOString(),
    updatedAt: now,
    dirty: 1,
  };

  await db.textileTypes.put(record);
  return record;
}

/**
  * Renomme un type de textile existant.
  */
export async function updateTextileType(id: string, name: string): Promise<TextileTypeRecord | undefined> {
  const existing = await db.textileTypes.get(id);
  if (!existing) return undefined;

  const updated: TextileTypeRecord = {
    ...existing,
    name: name.trim(),
    updatedAt: Date.now(),
    dirty: 1,
  };

  await db.textileTypes.put(updated);
  return updated;
}

/**
  * Supprime un type de textile et toutes ses distributions associées.
  */
export async function deleteTextileType(id: string): Promise<void> {
  await db.transaction('rw', [db.textileTypes, db.textileDistributions], async () => {
    await db.textileDistributions.where('textileTypeId').equals(id).delete();
    await db.textileTypes.delete(id);
  });
}

/**
  * Récupère toutes les attributions de textiles enregistrées.
  */
export async function getAllTextileDistributions(): Promise<TextileDistributionRecord[]> {
  return await db.textileDistributions.toArray();
}

/**
  * Récupère les attributions d'un élève spécifique.
  */
export async function getTextileDistributionsByStudent(studentId: string): Promise<TextileDistributionRecord[]> {
  return await db.textileDistributions.where('studentId').equals(studentId).toArray();
}

/**
  * Récupère les attributions pour un type de textile donné.
  */
export async function getTextileDistributionsByType(textileTypeId: string): Promise<TextileDistributionRecord[]> {
  return await db.textileDistributions.where('textileTypeId').equals(textileTypeId).toArray();
}

/**
  * Bascule ou définit le statut d'attribution d'un textile pour un élève.
  */
export async function toggleStudentTextile(
  studentId: string,
  textileTypeId: string,
  received?: boolean,
  date?: string
): Promise<TextileDistributionRecord> {
  const recordId = `${studentId}_${textileTypeId}`;
  const existing = await db.textileDistributions.get(recordId);

  const newReceived = received !== undefined ? received : (existing ? !existing.received : true);
  const receivedDate = newReceived
    ? (date ? formatDateBrussels(date) : (existing?.receivedDate || getTodayBrussels()))
    : '';

  const record: TextileDistributionRecord = {
    id: recordId,
    studentId,
    textileTypeId,
    received: newReceived,
    receivedDate,
    updatedAt: Date.now(),
    dirty: 1,
  };

  await db.textileDistributions.put(record);
  return record;
}

/**
  * Distribution groupée / en masse : attribue un textile à une liste d'élèves en une seule opération.
  * @param studentIds Liste des IDs d'élèves
  * @param textileTypeId ID du type de textile
  * @param received Statut d'attribution (true = reçu, false = non reçu / retiré)
  * @param date Date de remise (YYYY-MM-DD, par défaut aujourd'hui)
  */
export async function batchDistributeTextiles(
  studentIds: string[],
  textileTypeId: string,
  received = true,
  date?: string
): Promise<number> {
  const normDate = received ? (date ? formatDateBrussels(date) : getTodayBrussels()) : '';
  const now = Date.now();
  let count = 0;

  await db.transaction('rw', db.textileDistributions, async () => {
    for (const sId of studentIds) {
      const recordId = `${sId}_${textileTypeId}`;
      const record: TextileDistributionRecord = {
        id: recordId,
        studentId: sId,
        textileTypeId,
        received,
        receivedDate: normDate,
        updatedAt: now,
        dirty: 1,
      };
      await db.textileDistributions.put(record);
      count++;
    }
  });

  return count;
}

/**
  * Récupère les types de textiles modifiés en attente de synchronisation.
  */
export async function getDirtyTextileTypes(): Promise<TextileTypeRecord[]> {
  return await db.textileTypes.where('dirty').equals(1).toArray();
}

/**
  * Marque les types de textiles comme synchronisés.
  */
export async function markTextileTypesSynced(ids: string[]): Promise<void> {
  await db.transaction('rw', db.textileTypes, async () => {
    for (const id of ids) {
      await db.textileTypes.update(id, { dirty: 0 });
    }
  });
}

/**
  * Récupère les distributions modifiées en attente de synchronisation.
  */
export async function getDirtyTextileDistributions(): Promise<TextileDistributionRecord[]> {
  return await db.textileDistributions.where('dirty').equals(1).toArray();
}

/**
  * Marque les distributions comme synchronisées.
  */
export async function markTextileDistributionsSynced(ids: string[]): Promise<void> {
  await db.transaction('rw', db.textileDistributions, async () => {
    for (const id of ids) {
      await db.textileDistributions.update(id, { dirty: 0 });
    }
  });
}
