import { describe, it, expect } from 'vitest';
import { normalizeGender, detectColumnMapping } from '../../src/io/import';

describe('IO: import', () => {
  it('normalise correctement le sexe', () => {
    expect(normalizeGender('F')).toBe('F');
    expect(normalizeGender('fille')).toBe('F');
    expect(normalizeGender('Féminin')).toBe('F');
    expect(normalizeGender('M')).toBe('M');
    expect(normalizeGender('Garçon')).toBe('M');
    expect(normalizeGender('inconnu')).toBeNull();
  });

  it('détecte les en-têtes de colonnes', () => {
    const headers = ['Nom de famille', 'Prénom', 'Sexe', 'Classe', 'Commentaire'];
    const mapping = detectColumnMapping(headers);
    expect(mapping.lastNameCol).toBe('Nom de famille');
    expect(mapping.firstNameCol).toBe('Prénom');
    expect(mapping.genderCol).toBe('Sexe');
    expect(mapping.yearCol).toBe('Classe');
    expect(mapping.notesCol).toBe('Commentaire');
  });
});
