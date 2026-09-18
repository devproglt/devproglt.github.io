import { db } from './schema';
import { generateDeviceId } from '../domain/ids';

export async function getMeta<T>(key: string, defaultValue: T): Promise<T> {
  const record = await db.meta.get(key);
  if (!record || record.value === undefined || record.value === null) {
    return defaultValue;
  }
  return record.value as T;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  await db.meta.put({ key, value });
}

export async function getDeviceId(): Promise<string> {
  let deviceId = await getMeta<string | null>('deviceId', null);
  if (!deviceId) {
    deviceId = generateDeviceId();
    await setMeta('deviceId', deviceId);
  }
  return deviceId;
}

export async function getYearsList(): Promise<string[]> {
  const defaultYears = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];
  return await getMeta<string[]>('years', defaultYears);
}

export async function setYearsList(years: string[]): Promise<void> {
  await setMeta('years', years);
}

export async function addYearIfMissing(year: string): Promise<string[]> {
  const years = await getYearsList();
  const trimmed = year.trim();
  if (trimmed && !years.includes(trimmed)) {
    years.push(trimmed);
    await setYearsList(years);
  }
  return years;
}

export async function getAllowMultipleSessionsPerDay(): Promise<boolean> {
  return await getMeta<boolean>('allowMultipleSessionsPerDay', false);
}

export async function setAllowMultipleSessionsPerDay(allow: boolean): Promise<void> {
  await setMeta('allowMultipleSessionsPerDay', allow);
}

