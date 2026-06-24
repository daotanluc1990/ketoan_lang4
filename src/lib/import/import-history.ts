import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export async function getImportHistory() {
  return getDataStore().read(SHEET_NAMES.IMPORT_LICH_SU);
}
