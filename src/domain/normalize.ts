/**
 * Normalise une chaîne de caractères (suppression des accents, minuscules, espaces superflus).
 * Utile pour la recherche insensible à la casse et aux diacritiques.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calcule la clé de recherche normalisée pour un élève.
 * Combine prénom et nom pour permettre la recherche croisée.
 */
export function buildSearchKey(firstName: string, lastName: string): string {
  const fn = normalizeText(firstName);
  const ln = normalizeText(lastName);
  return `${fn} ${ln} ${ln} ${fn}`;
}
