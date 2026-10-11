import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../src/db/schema';
import {
  getTextileTypes,
  createTextileType,
  updateTextileType,
  deleteTextileType,
  getAllTextileDistributions,
  getTextileDistributionsByStudent,
  toggleStudentTextile,
  batchDistributeTextiles,
} from '../../src/db/textiles';

describe('DB: Textiles Management & Batch Distribution', () => {
  beforeEach(async () => {
    await db.textileTypes.clear();
    await db.textileDistributions.clear();
  });

  it('commence avec zéro textiles par défaut', async () => {
    const types = await getTextileTypes();
    expect(types).toEqual([]);
    expect(types.length).toBe(0);
  });

  it('permet de créer, renommer et supprimer des types de textiles', async () => {
    const tshirt = await createTextileType('T-shirt club');
    expect(tshirt.id).toBeDefined();
    expect(tshirt.name).toBe('T-shirt club');

    const veste = await createTextileType('Veste');
    expect(veste.name).toBe('Veste');

    const all = await getTextileTypes();
    expect(all.length).toBe(2);

    // Renommer
    const updated = await updateTextileType(tshirt.id, 'T-shirt Officiel');
    expect(updated?.name).toBe('T-shirt Officiel');

    // Supprimer
    await deleteTextileType(veste.id);
    const afterDelete = await getTextileTypes();
    expect(afterDelete.length).toBe(1);
    expect(afterDelete[0].name).toBe('T-shirt Officiel');
  });

  it('gère l\'attribution individuelle d\'un textile à un élève', async () => {
    const tshirt = await createTextileType('T-shirt');
    const studentId = 'eleve_123';

    // 1er clic : marquer comme reçu
    const dist1 = await toggleStudentTextile(studentId, tshirt.id, true, '2026-10-09');
    expect(dist1.received).toBe(true);
    expect(dist1.receivedDate).toBe('2026-10-09');

    const byStudent = await getTextileDistributionsByStudent(studentId);
    expect(byStudent.length).toBe(1);
    expect(byStudent[0].received).toBe(true);

    // 2e clic (toggle off)
    const dist2 = await toggleStudentTextile(studentId, tshirt.id);
    expect(dist2.received).toBe(false);

    const byStudentAfter = await getTextileDistributionsByStudent(studentId);
    expect(byStudentAfter[0].received).toBe(false);
  });

  it('permet la distribution groupée à 30 personnes en une seule opération', async () => {
    const tshirt = await createTextileType('T-shirt');
    const studentIds: string[] = [];
    for (let i = 1; i <= 30; i++) {
      studentIds.push(`eleve_${i}`);
    }

    // Donner le t-shirt aux 30 personnes en une fois
    const count = await batchDistributeTextiles(studentIds, tshirt.id, true, '2026-10-09');
    expect(count).toBe(30);

    const allDist = await getAllTextileDistributions();
    expect(allDist.length).toBe(30);
    expect(allDist.every((d) => d.received === true)).toBe(true);
    expect(allDist.every((d) => d.receivedDate === '2026-10-09')).toBe(true);

    // Retirer le t-shirt aux 10 premiers en une fois
    const subset = studentIds.slice(0, 10);
    await batchDistributeTextiles(subset, tshirt.id, false);

    const allDistAfter = await getAllTextileDistributions();
    const receivedCount = allDistAfter.filter((d) => d.received).length;
    expect(receivedCount).toBe(20);
  });
});
