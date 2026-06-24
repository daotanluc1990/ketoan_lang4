import type { DataStore } from './store-interface';
import { sheetsRepository } from '@/lib/google-sheets/sheets-repository';

export const googleSheetsStore: DataStore = {
  async read(sheetName) {
    return sheetsRepository.readRows(sheetName);
  },
  async append(sheetName, rows) {
    return sheetsRepository.appendRows({ sheetName, rows });
  },
  async replace() {
    throw new Error('Không cho replace trực tiếp Google Sheet trong V1. Dùng append + trạng thái rollback.');
  }
};
