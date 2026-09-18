import { describe, it, expect } from 'vitest';
import { generateAttendanceSummaryText } from '../../src/domain/summary';
import type { DaySummary } from '../../src/domain/stats';

describe('Domain: summary generator', () => {
  const mockSummary: DaySummary = {
    total: 4,
    girls: 2,
    boys: 2,
    internals: 1,
    byYear: {
      '2B': { total: 1, girls: 1, boys: 0, internals: 0 },
      '1A': { total: 2, girls: 1, boys: 1, internals: 1 },
      '10C': { total: 1, girls: 0, boys: 1, internals: 0 },
    },
  };

  const mockStudents = [
    { firstName: 'Zoé', lastName: 'Dubois', year: '2B' },
    { firstName: 'Bob', lastName: 'Martin', year: '1A' },
    { firstName: 'Alice', lastName: 'Dupont', year: '1A' },
    { firstName: 'Lucas', lastName: 'Bernard', year: '10C' },
  ];

  it('génère le résumé avec la date correcte, les totaux et le tri par classe croissant', () => {
    const text = generateAttendanceSummaryText({
      title: 'Entraînement Demi-fond',
      date: '2026-09-18',
      summary: mockSummary,
      students: mockStudents,
    });

    // 1. En-tête avec titre et date lisible
    expect(text).toContain('Résumé : Entraînement Demi-fond — ');
    expect(text).toContain('2026');
    expect(text).not.toContain('2001');

    // 2. Totaux
    expect(text).toContain('Total: 4 élève(s) (Filles: 2, Garçons: 2, Internes: 1)');

    // 3. Répartition par année triée
    expect(text).toContain('- 1A: 2 (F: 1, G: 1, I: 1)');
    expect(text).toContain('- 2B: 1 (F: 1, G: 0, I: 0)');
    expect(text).toContain('- 10C: 1 (F: 0, G: 1, I: 0)');

    // Vérifier l'ordre des classes : 1A avant 2B, et 2B avant 10C (tri numérique naturel)
    const pos1A = text.indexOf('- 1A:');
    const pos2B = text.indexOf('- 2B:');
    const pos10C = text.indexOf('- 10C:');
    expect(pos1A).toBeLessThan(pos2B);
    expect(pos2B).toBeLessThan(pos10C);

    // 4. Liste des présences triée par classe croissant, puis prénom, puis nom
    expect(text).toContain('Liste des présences (4) :');
    const alicePos = text.indexOf('- Alice Dupont (1A)');
    const bobPos = text.indexOf('- Bob Martin (1A)');
    const zoePos = text.indexOf('- Zoé Dubois (2B)');
    const lucasPos = text.indexOf('- Lucas Bernard (10C)');

    expect(alicePos).toBeGreaterThan(0);
    expect(bobPos).toBeGreaterThan(0);
    expect(zoePos).toBeGreaterThan(0);
    expect(lucasPos).toBeGreaterThan(0);

    expect(alicePos).toBeLessThan(bobPos); // 1A: Alice avant Bob
    expect(bobPos).toBeLessThan(zoePos);   // 1A avant 2B
    expect(zoePos).toBeLessThan(lucasPos); // 2B avant 10C
  });

  it('génère un résumé propre même si la liste des élèves est vide', () => {
    const emptySummary: DaySummary = {
      total: 0,
      girls: 0,
      boys: 0,
      internals: 0,
      byYear: {},
    };

    const text = generateAttendanceSummaryText({
      title: 'Course test',
      date: '2026-09-18',
      summary: emptySummary,
      students: [],
    });

    expect(text).toContain('Résumé : Course test');
    expect(text).toContain('Total: 0 élève(s)');
    expect(text).not.toContain('Liste des présences');
  });
});
