import type { StudentRecord, AttendanceRecord, EventRecord } from '../db/schema';

export interface PushRequestPayload {
  action: 'push';
  token: string;
  deviceId: string;
  students: StudentRecord[];
  events: EventRecord[];
  attendances: AttendanceRecord[];
}

export interface PushResponsePayload {
  ok: boolean;
  accepted?: string[];
  rejected?: string[];
  error?: string;
}

export interface PullRequestPayload {
  action: 'pull';
  token: string;
  since: number;
}

export interface PullResponsePayload {
  ok: boolean;
  students?: StudentRecord[];
  events?: EventRecord[];
  attendances?: AttendanceRecord[];
  cursor?: number;
  error?: string;
}

/**
 * Exécute un push de synchronisation vers Google Apps Script.
 */
export async function pushToServer(
  syncUrl: string,
  token: string,
  deviceId: string,
  dirtyStudents: StudentRecord[],
  dirtyEvents: EventRecord[],
  dirtyAttendances: AttendanceRecord[]
): Promise<PushResponsePayload> {
  const payload: PushRequestPayload = {
    action: 'push',
    token,
    deviceId,
    students: dirtyStudents,
    events: dirtyEvents,
    attendances: dirtyAttendances,
  };

  try {
    const response = await fetch(syncUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur réseau HTTP ${response.status}`);
    }

    const text = await response.text();
    let data: PushResponsePayload;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        'Réponse invalide reçue de Google Apps Script. Vérifiez que l\'accès Web App est configuré sur "Tout le monde" (Anyone).'
      );
    }

    if (!data.ok) {
      if (data.error === 'unauthorized') {
        throw new Error('Jeton de sécurité (Token) incorrect.');
      }
      throw new Error(data.error || 'Erreur lors du push serveur');
    }

    return data;
  } catch (err: any) {
    if (err.message && (err.message.includes('fetch') || err.message.includes('Network') || err.message.includes('Failed'))) {
      throw new Error(
        'Impossible de contacter Google Sheets. Vérifiez que l\'accès au déploiement Apps Script est réglé sur "Tout le monde" (Anyone) et que l\'URL se termine par /exec.'
      );
    }
    throw err;
  }
}

/**
 * Exécute un pull de synchronisation depuis Google Apps Script.
 */
export async function pullFromServer(
  syncUrl: string,
  token: string,
  sinceCursor: number
): Promise<PullResponsePayload> {
  const payload: PullRequestPayload = {
    action: 'pull',
    token,
    since: sinceCursor,
  };

  try {
    const response = await fetch(syncUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur réseau HTTP ${response.status}`);
    }

    const text = await response.text();
    let data: PullResponsePayload;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        'Réponse invalide reçue de Google Apps Script. Vérifiez que l\'accès Web App est configuré sur "Tout le monde" (Anyone).'
      );
    }

    if (!data.ok) {
      if (data.error === 'unauthorized') {
        throw new Error('Jeton de sécurité (Token) incorrect.');
      }
      throw new Error(data.error || 'Erreur lors du pull serveur');
    }

    return data;
  } catch (err: any) {
    if (err.message && (err.message.includes('fetch') || err.message.includes('Network') || err.message.includes('Failed'))) {
      throw new Error(
        'Impossible de contacter Google Sheets. Vérifiez que l\'accès au déploiement Apps Script est réglé sur "Tout le monde" (Anyone) et que l\'URL se termine par /exec.'
      );
    }
    throw err;
  }
}
