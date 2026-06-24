import { describe, expect, it } from 'vitest';
import { calculateBalance } from '../balance-calculator';

const valid = { 'Mã lần import': 'IMP-test', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Mã tuần': '2026-W26', 'Chi nhánh': 'Làng NVT' };

describe('calculateBalance', () => {
  it('surfaces missing inventory and debt instead of pretending balance is complete', () => {
    const result = calculateBalance({
      cashbookRows: [{ ...valid, 'Số tiền': 3000000 }, { ...valid, 'Số tiền': -1000000, 'Diễn giải': 'Phiếu chi Tiền trả NCC' }],
      inventoryRows: [],
      debtRows: [],
      purchaseRows: []
    });

    expect(result.totals.cashNet).toBe(2000000);
    expect(result.status).toBe('partial');
    expect(result.limitations.some((item) => item.includes('DL_CONG_NO'))).toBe(true);
  });

  it('calculates debt and inventory when sources are available', () => {
    const result = calculateBalance({
      cashbookRows: [{ ...valid, 'Số tiền': 3000000 }, { ...valid, 'Số tiền': -13000000, 'Diễn giải': 'Phiếu chi Tiền trả NCC' }],
      inventoryRows: [{ ...valid, 'Tồn kho': 25, 'Giá trị tồn': 2500000 }],
      debtRows: [{ ...valid, 'Phải trả': 20000000, 'Đã trả': 13000000, 'Còn phải trả': 7000000 }],
      purchaseRows: [{ ...valid, 'Tác động tiền': 250000 }]
    });

    expect(result.totals.inventoryValue).toBe(2500000);
    expect(result.totals.remainingDebt).toBe(7000000);
    expect(result.totals.debtPaymentOut).toBe(13000000);
    expect(result.status).toBe('complete');
  });
});
