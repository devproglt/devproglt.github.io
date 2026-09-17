/**
 * Génération des identifiants (UUID v4 et clés déterministes).
 */

/**
 * Génère un UUID v4 pour un nouvel élève.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Clé déterministe pour une présence.
 * Format: {studentId}_{date}_{type}
 */
export function buildAttendanceId(studentId: string, date: string, type: 'presence' | 'course'): string {
  return `${studentId}_${date}_${type}`;
}

/**
 * Génère un identifiant d'appareil lisible.
 */
export function generateDeviceId(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `android-device-${randomSuffix}`;
}
