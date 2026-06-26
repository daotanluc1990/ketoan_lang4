import type { DataStore, DataRow } from './store-interface';
import { sheetsRepository } from '@/lib/google-sheets/sheets-repository';

const TTL_MS = 60_000;
let lastReadAt = 0;
let rowsBySheet: Record<string, DataRow[]> = {};

async function readRows(sheetName: string) {
  const cached = rowsBySheet[sheetName];
  if (cached && Date.now() - lastReadAt < TTL_MS) return cached;
  const rows = await sheetsRepository.readRows(sheetName);
  rowsBySheet = { ...rowsBySheet, [sheetName]: rows };
  lastReadAt = Date.now();
  return rows;
}

export const googleSheetsStore: DataStore = {
  async read(sheetName) {
    return readRows(sheetName);
  },
  async append(sheetName, rows) {
    await sheetsRepository.appendRows({ sheetName, rows });
    rowsBySheet = {};
    lastReadAt = 0;
  },
  async replace() {
    throw new Error('Không cho replace trực tiếp Google Sheet trong V1. Dùng append + trạng thái rollback.');
  }
};
