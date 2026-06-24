import { describe, expect, it } from 'vitest';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { analyzeCashbookRows } from '@/lib/reports/cashbook-analysis';
import { buildDataQualityReport } from '../data-quality-engine';
import { buildAccountingWorkbenchTasks } from '../accounting-workbench-agent';

const sourceCounts = {
  storeRevenue: 1,
  appRevenue: 1,
  cashbook: 2,
  inventory: 0,
  lossRows: 0,
  debt: 0,
  purchase: 0,
  auditRows: 0,
  importHistory: 0
};

describe('Accounting Workbench Agent', () => {
  it('combines data quality tasks with cashbook classification tasks', () => {
    const cashbook = [
      { 'Mã dòng dữ liệu': 'cash-1', 'Mã lần import': 'IMP-cash-1', 'Ngày': '2026-06-23', 'Mã tuần': '2026-W26', 'Chi nhánh': 'Làng NVT', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Nhóm thu/chi': 'Khác', 'Diễn giải': 'Phiếu chi Tiền trả NCC', 'Số tiền': -12000000 },
      { 'Mã dòng dữ liệu': 'cash-2', 'Mã lần import': 'IMP-cash-2', 'Ngày': '2026-06-23', 'Mã tuần': '2026-W26', 'Chi nhánh': 'Làng NVT', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Nhóm thu/chi': 'Khác', 'Diễn giải': 'Đầu tư nhà xưởng BTT', 'Số tiền': -10500000 }
    ];
    const dataQuality = buildDataQualityReport({
      [SHEET_NAMES.DL_DOANH_THU_CUA_HANG]: [{ 'Mã dòng dữ liệu': 'store-1', 'Mã lần import': 'IMP-store-1', 'Trạng thái dữ liệu': 'Đã xác nhận' }],
      [SHEET_NAMES.DL_DOANH_THU_APP]: [{ 'Mã dòng dữ liệu': 'app-1', 'Mã lần import': 'IMP-app-1', 'Trạng thái dữ liệu': 'Đã xác nhận' }],
      [SHEET_NAMES.DL_SO_QUY]: cashbook
    });
    const cashbookAnalysis = analyzeCashbookRows(cashbook, { debt: 0, purchase: 0, inventory: 0, lossRows: 0 });
    const tasks = buildAccountingWorkbenchTasks({ dataQuality, cashbookAnalysis, sourceCounts });

    expect(tasks.some((task) => task.task.includes('Đối chiếu tiền trả NCC'))).toBe(true);
    expect(tasks.some((task) => task.task.includes('capex') && task.needsCeoApproval)).toBe(true);
    expect(tasks.some((task) => task.type === 'close_report')).toBe(true);
  });
});
