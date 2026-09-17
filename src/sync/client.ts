import type { StudentRecord, AttendanceRecord } from '../db/schema';

export interface PushRequestPayload {
  action: 'push';
  token: string;
  deviceId: string;
  students: StudentRecord[];
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
  dirtyAttendances: AttendanceRecord[]
): Promise<PushResponsePayload> {
  const payload: PushRequestPayload = {
    action: 'push',
    token,
    deviceId,
    students: dirtyStudents,
    attendances: dirtyAttendances,
  };

  const response = await fetch(syncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erreur réseau HTTP ${response.status}`);
  }

  const data: PushResponsePayload = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Erreur lors du push serveur');
  }

  return data;
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

  const response = await fetch(syncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erreur réseau HTTP ${response.status}`);
  }

  const data: PullResponsePayload = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Erreur lors du pull serveur');
  }

  return data;
}
