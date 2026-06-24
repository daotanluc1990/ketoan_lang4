import { describe, expect, it } from 'vitest';
import { applySourceFilter, buildFilterOptions, isValidImportRow, parseReportFilterFromSearchParams } from '../report-filters';

const rows = [
  { 'Mã dòng dữ liệu': '1', 'Mã lần import': 'IMP-1', 'Ngày': '2026-06-01', 'Mã tuần': '2026-W23', 'Chi nhánh': 'Làng NVT', 'Kênh bán': 'Grab', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Người import': 'Kế toán', 'Doanh thu ròng': 1000000 },
  { 'Mã dòng dữ liệu': '2', 'Mã lần import': 'IMP-2', 'Ngày': '2026-06-08', 'Mã tuần': '2026-W24', 'Chi nhánh': 'Làng NVT', 'Kênh bán': 'ShopeeFood', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Người import': 'Kế toán', 'Doanh thu ròng': 2000000 },
  { 'Mã dòng dữ liệu': '3', 'Mã lần import': 'IMP-3', 'Ngày': '2026-06-01', 'Mã tuần': '2026-W23', 'Chi nhánh': 'Làng GV', 'Kênh bán': 'Grab', 'Trạng thái dữ liệu': 'Nháp', 'Người import': 'CEO', 'Doanh thu ròng': 3000000 },
  { 'Mã dòng dữ liệu': '', 'Ngày': '2026-06-01', 'Mã tuần': '2026-W23', 'Chi nhánh': 'Dòng mẫu', 'Kênh bán': 'Mẫu', 'Trạng thái dữ liệu': 'Cảnh báo', 'Người import': '', 'Doanh thu ròng': 9000000 }
];

describe('report filters', () => {
  it('treats only confirmed IMP rows as valid source data', () => {
    expect(isValidImportRow(rows[0])).toBe(true);
    expect(isValidImportRow(rows[2])).toBe(false);
    expect(isValidImportRow(rows[3])).toBe(false);
  });

  it('parses URL query and filters by week, branch, channel and data status', () => {
    const filter = parseReportFilterFromSearchParams(new URLSearchParams('weekCode=2026-W23&branch=L%C3%A0ng%20NVT&channel=Grab&dataStatus=%C4%90%C3%A3%20x%C3%A1c%20nh%E1%BA%ADn'));
    const filtered = applySourceFilter(rows, 'appRevenue', filter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]['Doanh thu ròng']).toBe(1000000);
  });

  it('builds filter options from real confirmed source rows instead of hard-coded choices or sample rows', () => {
    const options = buildFilterOptions({ appRevenue: rows });
    expect(options.branches).toEqual(['Làng NVT']);
    expect(options.weekCodes).toEqual(['2026-W23', '2026-W24']);
    expect(options.channels).toEqual(['Grab', 'ShopeeFood']);
    expect(options.importedBy).toEqual(['Kế toán']);
  });
});
