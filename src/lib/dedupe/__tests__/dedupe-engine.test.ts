import { describe, expect, it } from 'vitest';
import { buildExistingRowIndex, classifyImportRows } from '../dedupe-engine';
import { createRowHash } from '@/lib/import/row-hash';
import type { ImportRow } from '@/lib/import/import-types';

describe('dedupe engine', () => {
  it('keeps row hash stable when import metadata changes', () => {
    const businessData = {
      'Ngày': '2026-06-23',
      'Mã phiếu': 'TTM001',
      'Số tiền': -840000
    };

    const firstHash = createRowHash({
      ...businessData,
      'Trạng thái dữ liệu': 'Preview',
      'Ngày import': '2026-06-24T10:00:00.000Z'
    });
    const secondHash = createRowHash({
      ...businessData,
      'Trạng thái dữ liệu': 'Đã xác nhận',
      'Ngày import': '2026-06-24T11:00:00.000Z',
      'Người import': 'Kế toán'
    });

    expect(secondHash).toBe(firstHash);
  });

  it('treats legacy imported rows as duplicates when business fields are unchanged even if stored hash differs', () => {
    const importedRow: ImportRow = {
      maDongDuLieu: 'DL_SO_QUY::TTM001',
      dauVetDong: createRowHash({
        'Ngày': '2026-06-23',
        'Diễn giải': 'Phiếu chi Tiền trả NCC',
        'Số tiền': -840000,
        'Ngày import': '2026-06-24T11:00:00.000Z'
      }),
      sheetDich: 'DL_SO_QUY',
      data: {
        'Ngày': '2026-06-23',
        'Diễn giải': 'Phiếu chi Tiền trả NCC',
        'Số tiền': -840000,
        'Trạng thái dữ liệu': 'Preview',
        'Ngày import': '2026-06-24T11:00:00.000Z'
      },
      errors: []
    };

    const existingIndex = buildExistingRowIndex([
      {
        'Mã dòng dữ liệu': 'DL_SO_QUY::TTM001',
        'Dấu vết dòng': 'legacy-hash-created-with-volatile-import-date',
        'Ngày': '2026-06-23',
        'Diễn giải': 'Phiếu chi Tiền trả NCC',
        'Số tiền': -840000,
        'Trạng thái dữ liệu': 'Đã xác nhận',
        'Ngày import': '2026-06-24T10:00:00.000Z'
      }
    ]);

    expect(classifyImportRows([importedRow], existingIndex)[0].status).toBe('Dữ liệu trùng');
  });
});
