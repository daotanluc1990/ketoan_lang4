import type { DataStore } from './store-interface';
import { googleSheetsStore } from './google-sheets-store';
import { localJsonStore } from './local-json-store';

export function getDataStore(): DataStore {
  return process.env.DATA_STORE === 'google_sheets' ? googleSheetsStore : localJsonStore;
}
