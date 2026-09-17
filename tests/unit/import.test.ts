import { describe, it, expect } from 'vitest';
import { normalizeGender, normalizeBoolean, detectColumnMapping } from '../../src/io/import';

describe('IO: import', () => {
  it('normalise correctement le sexe', () => {
    expect(normalizeGender('F')).toBe('F');
    expect(normalizeGender('fille')).toBe('F');
    expect(normalizeGender('Féminin')).toBe('F');
    expect(normalizeGender('M')).toBe('M');
    expect(normalizeGender('Garçon')).toBe('M');
    expect(normalizeGender('inconnu')).toBe('F');
  });

  it('normalise les valeurs booléennes pour EstInterne', () => {
    expect(normalizeBoolean('Oui')).toBe(true);
    expect(normalizeBoolean('true')).toBe(true);
    expect(normalizeBoolean('1')).toBe(true);
    expect(normalizeBoolean('interne')).toBe(true);
    expect(normalizeBoolean('Non')).toBe(false);
    expect(normalizeBoolean('')).toBe(false);
    expect(normalizeBoolean(null)).toBe(false);
  });

  it('détecte les en-têtes de colonnes', () => {
    const headers = ['Nom de famille', 'Prénom', 'Sexe', 'Classe', 'Interne', 'Commentaire'];
    const mapping = detectColumnMapping(headers);
    expect(mapping.lastNameCol).toBe('Nom de famille');
    expect(mapping.firstNameCol).toBe('Prénom');
    expect(mapping.genderCol).toBe('Sexe');
    expect(mapping.yearCol).toBe('Classe');
    expect(mapping.isInternalCol).toBe('Interne');
    expect(mapping.notesCol).toBe('Commentaire');
  });
});
