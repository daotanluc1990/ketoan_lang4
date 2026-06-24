import { describe, expect, it } from 'vitest';
import { calculateLoss } from '../loss-calculator';

const valid = { 'Mã lần import': 'IMP-test', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Mã tuần': '2026-W26', 'Chi nhánh': 'Làng NVT' };

describe('calculateLoss', () => {
  it('returns missing status when no loss source exists', () => {
    const result = calculateLoss({ lossRows: [] });
    expect(result.totalLossValue).toBe(0);
    expect(result.status).toBe('missing');
    expect(result.limitations[0]).toContain('DL_THAT_THOAT_NVL');
  });

  it('ranks loss rows and returns top rows', () => {
    const result = calculateLoss({
      lossRows: [
        { ...valid, 'Tên nguyên vật liệu': 'Gạo', 'Đơn vị tính': 'kg', 'Chênh lệch số lượng': -1, 'Giá trị chênh lệch': -50000, 'Tỷ lệ thất thoát': '1%', 'Trạng thái': 'Tốt' },
        { ...valid, 'Tên nguyên vật liệu': 'Sườn', 'Đơn vị tính': 'kg', 'Chênh lệch số lượng': -3, 'Giá trị chênh lệch': -300000, 'Tỷ lệ thất thoát': '4.2%', 'Mức vượt định mức': '2.2%', 'Trạng thái': 'Cảnh báo' }
      ]
    });

    expect(result.totalLossValue).toBe(350000);
    expect(result.topRows[0][0]).toBe('Sườn');
    expect(result.status).toBe('complete');
  });
});
