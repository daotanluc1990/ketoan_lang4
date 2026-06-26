import type { DataStore, DataRow } from './store-interface';
import { sheetsRepository } from '@/lib/google-sheets/sheets-repository';

const TTL_MS = 5 * 60 * 1000;
let rowsBySheet: Record<string, DataRow[]> = {};
let timeBySheet: Record<string, number> = {};

function isFresh(sheetName: string) {
  return Boolean(rowsBySheet[sheetName]) && Date.now() - (timeBySheet[sheetName] ?? 0) < TTL_MS;
}

async function readRows(sheetName: string) {
  if (isFresh(sheetName)) return rowsBySheet[sheetName];
  const rows = await sheetsRepository.readRows(sheetName);
  rowsBySheet = { ...rowsBySheet, [sheetName]: rows };
  timeBySheet = { ...timeBySheet, [sheetName]: Date.now() };
  return rows;
}

async function readManyRows(sheetNames: string[]) {
  const uniqueNames = Array.from(new Set(sheetNames));
  const result: Record<string, DataRow[]> = {};
  const missing = uniqueNames.filter((sheetName) => {
    if (isFresh(sheetName)) {
      result[sheetName] = rowsBySheet[sheetName];
      return false;
    }
    return true;
  });

  if (missing.length) {
    const freshRows = await sheetsRepository.readRowsBatch(missing);
    const now = Date.now();
    for (const sheetName of missing) {
      result[sheetName] = freshRows[sheetName] ?? [];
      rowsBySheet = { ...rowsBySheet, [sheetName]: result[sheetName] };
      timeBySheet = { ...timeBySheet, [sheetName]: now };
    }
  }
  return result;
}

export const googleSheetsStore: DataStore = {
  async read(sheetName) {
    return readRows(sheetName);
  },
  async readMany(sheetNames) {
    return readManyRows(sheetNames);
  },
  async append(sheetName, rows) {
    await sheetsRepository.appendRows({ sheetName, rows });
    rowsBySheet = {};
    timeBySheet = {};
  },
  async replace() {
    throw new Error('Không cho replace trực tiếp Google Sheet trong V1. Dùng append + trạng thái rollback.');
  }
};
