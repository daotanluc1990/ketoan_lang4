import type { ImportRow, ImportRowStatus } from '@/lib/import/import-types';

export type ExistingRowIndex = Map<string, string>;

export function buildExistingRowIndex(existingRows: Record<string, unknown>[]): ExistingRowIndex {
  const index = new Map<string, string>();
  for (const row of existingRows) {
    const key = String(row['Mã dòng dữ liệu'] ?? '');
    const hash = String(row['Dấu vết dòng'] ?? '');
    if (key) index.set(key, hash);
  }
  return index;
}

export function classifyImportRows(rows: ImportRow[], existingIndex: ExistingRowIndex): ImportRow[] {
  return rows.map((row) => {
    let status: ImportRowStatus = 'Dòng mới';
    const existingHash = existingIndex.get(row.maDongDuLieu);
    if (row.errors?.length) status = 'Dòng lỗi';
    else if (existingHash && existingHash === row.dauVetDong) status = 'Dữ liệu trùng';
    else if (existingHash && existingHash !== row.dauVetDong) status = 'Dữ liệu lệch';
    return { ...row, status };
  });
}
