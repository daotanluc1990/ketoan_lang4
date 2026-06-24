import type { ImportRow, ImportRowStatus } from '@/lib/import/import-types';

const IMPORT_METADATA_FIELDS = new Set([
  'Mã dòng dữ liệu',
  'Mã lần import',
  'Dấu vết file',
  'Dấu vết dòng',
  'Trạng thái dữ liệu',
  'Ngày import',
  'Người import'
]);

type ExistingRowRecord = {
  hash: string;
  row: Record<string, unknown>;
};

export type ExistingRowIndex = Map<string, ExistingRowRecord>;

function normalizeComparable(value: unknown) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function hasSameBusinessData(imported: ImportRow, existing: Record<string, unknown>) {
  const comparableEntries = Object.entries(imported.data).filter(([key]) => !IMPORT_METADATA_FIELDS.has(key));
  return comparableEntries.length > 0 && comparableEntries.every(([key, value]) => normalizeComparable(existing[key]) === normalizeComparable(value));
}

export function buildExistingRowIndex(existingRows: Record<string, unknown>[]): ExistingRowIndex {
  const index = new Map<string, ExistingRowRecord>();
  for (const row of existingRows) {
    const key = String(row['Mã dòng dữ liệu'] ?? '');
    const hash = String(row['Dấu vết dòng'] ?? '');
    if (key) index.set(key, { hash, row });
  }
  return index;
}

export function classifyImportRows(rows: ImportRow[], existingIndex: ExistingRowIndex): ImportRow[] {
  return rows.map((row) => {
    let status: ImportRowStatus = 'Dòng mới';
    const existing = existingIndex.get(row.maDongDuLieu);
    const existingHash = existing?.hash;
    if (row.errors?.length) status = 'Dòng lỗi';
    else if (existingHash && existingHash === row.dauVetDong) status = 'Dữ liệu trùng';
    else if (existing && hasSameBusinessData(row, existing.row)) status = 'Dữ liệu trùng';
    else if (existingHash && existingHash !== row.dauVetDong) status = 'Dữ liệu lệch';
    return { ...row, status };
  });
}
