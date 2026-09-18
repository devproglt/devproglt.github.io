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
      '2': { total: 1, girls: 1, boys: 0, internals: 0 },
      '1': { total: 2, girls: 1, boys: 1, internals: 1 },
      '10': { total: 1, girls: 0, boys: 1, internals: 0 },
    },
  };

  const mockStudents = [
    { firstName: 'Zoé', lastName: 'Dubois', year: '2B' },
    { firstName: 'Bob', lastName: 'Martin', year: '1A' },
    { firstName: 'Alice', lastName: 'Dupont', year: '1A' },
    { firstName: 'Lucas', lastName: 'Bernard', year: '10C' },
  ];

  it('génère le résumé avec la date correcte, les totaux et le tri par année croissant', () => {
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
    expect(text).toContain('- 1: 2 (F: 1, G: 1, I: 1)');
    expect(text).toContain('- 2: 1 (F: 1, G: 0, I: 0)');
    expect(text).toContain('- 10: 1 (F: 0, G: 1, I: 0)');

    // Vérifier l'ordre des années : 1 avant 2, et 2 avant 10 (tri numérique naturel)
    const pos1 = text.indexOf('- 1:');
    const pos2 = text.indexOf('- 2:');
    const pos10 = text.indexOf('- 10:');
    expect(pos1).toBeLessThan(pos2);
    expect(pos2).toBeLessThan(pos10);

    // 4. Liste des présences triée par année croissante, puis prénom, puis nom
    expect(text).toContain('Liste des présences (4) :');
    const alicePos = text.indexOf('- Alice Dupont (1)');
    const bobPos = text.indexOf('- Bob Martin (1)');
    const zoePos = text.indexOf('- Zoé Dubois (2)');
    const lucasPos = text.indexOf('- Lucas Bernard (10)');

    expect(alicePos).toBeGreaterThan(0);
    expect(bobPos).toBeGreaterThan(0);
    expect(zoePos).toBeGreaterThan(0);
    expect(lucasPos).toBeGreaterThan(0);

    expect(alicePos).toBeLessThan(bobPos); // 1: Alice avant Bob
    expect(bobPos).toBeLessThan(zoePos);   // 1 avant 2
    expect(zoePos).toBeLessThan(lucasPos); // 2 avant 10
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
