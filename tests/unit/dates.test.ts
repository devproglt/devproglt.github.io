import { describe, it, expect } from 'vitest';
import { formatDateBrussels, getSchoolYearRange, getMonthRange } from '../../src/domain/dates';

describe('Domain: dates', () => {
  it('formate les dates en YYYY-MM-DD Europe/Brussels', () => {
    const d = new Date(Date.UTC(2026, 8, 17, 22, 0, 0)); // 17 Sept 2026 UTC
    const formatted = formatDateBrussels(d);
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('calcule la plage d\'année scolaire', () => {
    const rangeSept = getSchoolYearRange('2026-09-17');
    expect(rangeSept.start).toBe('2026-09-01');
    expect(rangeSept.end).toBe('2027-08-31');

    const rangeJan = getSchoolYearRange('2027-01-15');
    expect(rangeJan.start).toBe('2026-09-01');
    expect(rangeJan.end).toBe('2027-08-31');
  });

  it('calcule les bornes du mois', () => {
    const range = getMonthRange('2026-09-17');
    expect(range.start).toBe('2026-09-01');
    expect(range.end).toBe('2026-09-30');
  });
});
