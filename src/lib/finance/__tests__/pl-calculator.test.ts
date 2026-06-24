import { describe, expect, it } from 'vitest';
import { calculatePnl } from '../pl-calculator';

const valid = { 'Mã lần import': 'IMP-test', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Mã tuần': '2026-W26', 'Chi nhánh': 'Làng NVT' };

describe('calculatePnl', () => {
  it('does not create fake profit when only cashbook exists', () => {
    const result = calculatePnl({
      storeRevenueRows: [],
      appRevenueRows: [],
      lossRows: [],
      cashbookRows: [{ ...valid, 'Số tiền': -1000000, 'Nhóm thu/chi': 'Điện/nước/gas', 'Diễn giải': 'Chi điện nước gas' }]
    });

    expect(result.totals.revenue).toBe(0);
    expect(result.totals.netProfit).toBeNull();
    expect(result.rows.some((row) => row.includes('Chưa đủ dữ liệu'))).toBe(true);
  });

  it('calculates temporary P&L and excludes debt payment and capex from operating expense', () => {
    const result = calculatePnl({
      storeRevenueRows: [{ ...valid, 'Doanh thu bán hàng thực': 5000000 }],
      appRevenueRows: [{ ...valid, 'Doanh thu ròng': 3000000, 'Doanh thu gộp': 4000000, 'Tổng khấu trừ/phí': 900000, 'Giá vốn': 1400000 }],
      lossRows: [{ ...valid, 'Giá trị chênh lệch': -300000 }],
      cashbookRows: [
        { ...valid, 'Số tiền': -1200000, 'Nhóm thu/chi': 'Điện/nước/gas', 'Diễn giải': 'Chi điện nước gas' },
        { ...valid, 'Số tiền': -13000000, 'Nhóm thu/chi': 'Khác', 'Diễn giải': 'Phiếu chi Tiền trả NCC' },
        { ...valid, 'Số tiền': -10500000, 'Nhóm thu/chi': 'Khác', 'Diễn giải': 'Đầu tư nhà xưởng BTT' }
      ]
    });

    expect(result.totals.revenue).toBe(8000000);
    expect(result.totals.knownCogs).toBe(1700000);
    expect(result.totals.operatingExpenses).toBe(1200000);
    expect(result.totals.excludedCashOut).toBe(23500000);
    expect(result.totals.netProfit).toBe(5100000);
    expect(result.limitations.some((item) => item.includes('trả NCC/capex'))).toBe(true);
  });
});
