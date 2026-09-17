import { db, type ImportLogRecord } from './schema';
import { generateUUID } from '../domain/ids';

export async function addImportLog(
  fileName: string,
  created: number,
  updated: number,
  skipped: number
): Promise<ImportLogRecord> {
  const log: ImportLogRecord = {
    id: generateUUID(),
    date: new Date().toISOString(),
    fileName,
    created,
    updated,
    skipped,
  };
  await db.importLog.put(log);
  return log;
}

export async function getImportLogs(): Promise<ImportLogRecord[]> {
  return await db.importLog.orderBy('date').reverse().toArray();
}
