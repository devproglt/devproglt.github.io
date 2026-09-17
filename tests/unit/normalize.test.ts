import { describe, it, expect } from 'vitest';
import { normalizeText, buildSearchKey } from '../../src/domain/normalize';

describe('Domain: normalizeText', () => {
  it('supprime les accents, met en minuscules et retire les espaces superflus', () => {
    expect(normalizeText('  Maé  ')).toBe('mae');
    expect(normalizeText('MAËLLE')).toBe('maelle');
    expect(normalizeText('MAEVA')).toBe('maeva');
    expect(normalizeText('Éléonore')).toBe('eleonore');
  });

  it('gère les chaînes vides ou nulles', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });
});

describe('Domain: buildSearchKey', () => {
  it('combine le prénom et le nom normalisés', () => {
    const key = buildSearchKey('Maé', 'DUPONT');
    expect(key).toContain('mae');
    expect(key).toContain('dupont');
  });
});
