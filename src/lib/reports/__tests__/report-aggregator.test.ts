import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

vi.mock('@/lib/env/server-env', () => ({
  getServerEnv: () => ({ dataStore: 'local' })
}));

function createData(): Record<string, Record<string, unknown>[]> {
  return {
    [SHEET_NAMES.DL_DOANH_THU_CUA_HANG]: [
      { 'Mã dòng dữ liệu': 'store-1', 'Mã lần import': 'IMP-store-1', 'Ngày': '2026-06-01', 'Mã tuần': '2026-W23', 'Chi nhánh': 'Làng NVT', 'Ca bán': 'Offline', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Doanh thu bán hàng thực': 1000000 },
      { 'Mã dòng dữ liệu': 'store-2', 'Mã lần import': 'IMP-store-2', 'Ngày': '2026-06-08', 'Mã tuần': '2026-W24', 'Chi nhánh': 'Làng NVT', 'Ca bán': 'Offline', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Doanh thu bán hàng thực': 5000000 }
    ],
    [SHEET_NAMES.DL_DOANH_THU_APP]: [
      { 'Mã dòng dữ liệu': 'app-1', 'Mã lần import': 'IMP-app-1', 'Ngày': '2026-06-01', 'Mã tuần': '2026-W23', 'Chi nhánh': 'Làng NVT', 'Kênh bán': 'Grab', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Doanh thu ròng': 2000000, 'Doanh thu gộp': 2500000, 'Tổng khấu trừ/phí': 500000, 'Giá vốn': 800000 }
    ],
    [SHEET_NAMES.DL_SO_QUY]: [
      { 'Mã dòng dữ liệu': 'cash-1', 'Mã lần import': 'IMP-cash-1', 'Ngày': '2026-06-01', 'Mã tuần': '2026-W23', 'Chi nhánh': 'Làng NVT', 'Phương thức': 'Tiền mặt', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Số tiền': 3000000 },
      { 'Mã dòng dữ liệu': 'cash-2', 'Mã lần import': 'IMP-cash-2', 'Ngày': '2026-06-02', 'Mã tuần': '2026-W23', 'Chi nhánh': 'Làng NVT', 'Phương thức': 'Tiền mặt', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Số tiền': -1000000 }
    ],
    [SHEET_NAMES.DL_TON_KHO]: [],
    [SHEET_NAMES.DL_THAT_THOAT_NVL]: [],
    [SHEET_NAMES.DL_CONG_NO]: [],
    [SHEET_NAMES.DL_THU_MUA]: [],
    [SHEET_NAMES.AUDIT_LOG]: [],
    [SHEET_NAMES.IMPORT_LICH_SU]: []
  };
}

let data = createData();

vi.mock('@/lib/data-store', () => ({
  getDataStore: () => ({
    read: async (sheetName: string) => data[sheetName] ?? []
  })
}));

describe('buildDashboardReport with source contract filters', () => {
  beforeEach(() => {
    data = createData();
  });

  it('changes totals when the week filter changes and exposes evidence metadata', async () => {
    const { buildDashboardReport } = await import('../report-aggregator');
    const week23 = await buildDashboardReport({ weekCode: '2026-W23', source: 'all' });
    const week24 = await buildDashboardReport({ weekCode: '2026-W24', source: 'all' });

    expect(week23.totals.revenue).toBe(3000000);
    expect(week24.totals.revenue).toBe(5000000);
    expect(week23.filterMetadata.sourceRowCountsBefore.storeRevenue).toBe(2);
    expect(week23.filterMetadata.sourceRowCountsAfter.storeRevenue).toBe(1);
    expect(week23.filterMetadata.evidence.some((item) => item.includes('DL_DOANH_THU_CUA_HANG: 1/2'))).toBe(true);
  });

  it('uses cashbook descriptions to surface large expense and accounting tasks', async () => {
    const { buildDashboardReport } = await import('../report-aggregator');
    data[SHEET_NAMES.DL_SO_QUY].push({ 'Mã dòng dữ liệu': 'cash-3', 'Mã lần import': 'IMP-cash-3', 'Ngày': '2026-06-02', 'Mã tuần': '2026-W23', 'Chi nhánh': 'Làng NVT', 'Loại giao dịch': 'Chi', 'Nhóm thu/chi': 'Khác', 'Diễn giải': 'Phiếu chi Tiền trả NCC', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Số tiền': -12000000 });
    const report = await buildDashboardReport({ weekCode: '2026-W23', source: 'all' });

    expect(report.cashbookLargeExpenseRows.some((row) => row.includes('Trả NCC/công nợ'))).toBe(true);
    expect(report.accountingTaskRows.some((row) => row[1].includes('Đối chiếu tiền trả NCC'))).toBe(true);
    expect(report.issueRows.some((row) => row[1].includes('Tiền trả NCC'))).toBe(true);
    expect(report.totals.cashDebtPaymentOut).toBe(12000000);
  });
});
