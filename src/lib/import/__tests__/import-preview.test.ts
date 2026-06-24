import { describe, expect, it, vi } from 'vitest';
import { createRecordKey } from '@/lib/import/record-key';
import { createRowHash } from '@/lib/import/row-hash';
import { previewImport } from '../import-preview';

const storeMocks = vi.hoisted(() => ({
  read: vi.fn(),
  append: vi.fn(),
  replace: vi.fn()
}));

vi.mock('@/lib/data-store', () => ({
  getDataStore: () => storeMocks
}));

describe('previewImport', () => {
  it('is read-only and does not write audit or imported rows during dry-run preview', async () => {
    storeMocks.read.mockResolvedValue([]);

    const data = { 'Ngày': '2026-06-23', 'Số tiền': -840000 };
    const result = await previewImport({
      loaiDuLieu: 'Sổ quỹ',
      chiNhanh: 'NVT',
      tenFile: 'SoQuy_KV23062026-170744-853.xlsx',
      dauVetFile: 'file-hash',
      sheetDich: 'DL_SO_QUY',
      rows: [
        {
          maDongDuLieu: createRecordKey(['DL_SO_QUY', 'TTM001']),
          dauVetDong: createRowHash(data),
          sheetDich: 'DL_SO_QUY',
          data,
          errors: []
        }
      ],
      actor: 'local-test'
    });

    expect(storeMocks.read).toHaveBeenCalledWith('DL_SO_QUY');
    expect(storeMocks.append).not.toHaveBeenCalled();
    expect(storeMocks.replace).not.toHaveBeenCalled();
    expect(result.summary).toMatchObject({ dongMoi: 1, duLieuTrung: 0, duLieuLech: 0, dongLoi: 0 });
  });
});
