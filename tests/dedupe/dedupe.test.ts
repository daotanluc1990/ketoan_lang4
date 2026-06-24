import { describe, expect, it } from 'vitest';
import { buildExistingRowIndex, classifyImportRows } from '@/lib/dedupe/dedupe-engine';

describe('dedupe-engine', () => {
  it('phân loại dòng mới, trùng, lệch', () => {
    const index = buildExistingRowIndex([{ 'Mã dòng dữ liệu': 'A', 'Dấu vết dòng': 'HASH1' }]);
    const rows = classifyImportRows([
      { maDongDuLieu: 'A', dauVetDong: 'HASH1', sheetDich: 'S', data: {} },
      { maDongDuLieu: 'A', dauVetDong: 'HASH2', sheetDich: 'S', data: {} },
      { maDongDuLieu: 'B', dauVetDong: 'HASH3', sheetDich: 'S', data: {} }
    ], index);
    expect(rows.map((r) => r.status)).toEqual(['Dữ liệu trùng', 'Dữ liệu lệch', 'Dòng mới']);
  });
});
