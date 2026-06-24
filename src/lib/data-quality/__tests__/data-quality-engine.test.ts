import { describe, expect, it } from 'vitest';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { buildDataQualityReport } from '../data-quality-engine';

function row(id: string, extra: Record<string, unknown> = {}) {
  return {
    'Mã dòng dữ liệu': id,
    'Mã lần import': `IMP-${id}`,
    'Ngày': '2026-06-23',
    'Mã tuần': '2026-W26',
    'Chi nhánh': 'Làng NVT',
    'Trạng thái dữ liệu': 'Đã xác nhận',
    'Người import': 'test',
    ...extra
  };
}

describe('Data Quality Engine', () => {
  it('flags missing required sources and ignores rows that are not confirmed imports', () => {
    const report = buildDataQualityReport({
      [SHEET_NAMES.DL_SO_QUY]: [row('cash-1', { 'Số tiền': 1000000, 'Nhóm thu/chi': 'Doanh thu' })],
      [SHEET_NAMES.DL_DOANH_THU_APP]: [{ 'Mã dòng dữ liệu': 'sample', 'Mã lần import': 'Mẫu', 'Trạng thái dữ liệu': 'Cảnh báo' }]
    }, { weekCode: '2026-W26' });

    expect(report.sourceRows.find((source) => source.key === 'cashbook')?.validRows).toBe(1);
    expect(report.sourceRows.find((source) => source.key === 'appRevenue')?.validRows).toBe(0);
    expect(report.missingRequiredSources).toContain(SHEET_NAMES.DL_DOANH_THU_APP);
    expect(report.tasks.some((task) => task.task.includes('Import Doanh thu app'))).toBe(true);
  });

  it('surfaces import error, duplicate, and conflict control rows as accounting tasks', () => {
    const report = buildDataQualityReport({
      [SHEET_NAMES.DL_DOANH_THU_CUA_HANG]: [row('store-1', { 'Doanh thu bán hàng thực': 1000000 })],
      [SHEET_NAMES.DL_DOANH_THU_APP]: [row('app-1', { 'Doanh thu ròng': 1000000 })],
      [SHEET_NAMES.DL_SO_QUY]: [row('cash-1', { 'Số tiền': 1000000 })],
      [SHEET_NAMES.IMPORT_DONG_LOI]: [{ 'Mã lỗi': 'ERR-1' }],
      [SHEET_NAMES.IMPORT_DU_LIEU_TRUNG]: [{ 'Mã trùng': 'DUP-1' }],
      [SHEET_NAMES.IMPORT_DU_LIEU_LECH]: [{ 'Mã lệch': 'DIFF-1' }]
    });

    expect(report.importControl.errorRows).toBe(1);
    expect(report.importControl.duplicateRows).toBe(1);
    expect(report.importControl.conflictRows).toBe(1);
    expect(report.tasks.some((task) => task.type === 'import_error')).toBe(true);
    expect(report.tasks.some((task) => task.type === 'duplicate_data')).toBe(true);
    expect(report.tasks.some((task) => task.type === 'conflict_data' && task.needsCeoApproval)).toBe(true);
  });
});
