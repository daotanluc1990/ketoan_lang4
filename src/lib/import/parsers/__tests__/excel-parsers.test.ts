import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcelFile } from '../excel-parsers';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

function workbookBuffer(sheetName: string, rows: unknown[][]) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName);
  return Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer);
}

describe('parseExcelFile', () => {
  it('parses store revenue file into DL_DOANH_THU_CUA_HANG rows', () => {
    const buffer = workbookBuffer('Sheet1', [
      ['Tên CH', 'Ngày', 'Năm', 'Tháng', 'Ca', 'Tổng Phần', 'Số Hộp', 'Số Dĩa', 'Tiền Mặt', 'MoMo', 'Chi Tiền Mặt', 'TỔNG DOANH THU'],
      ['CN NVT', '01/06/2026', 2026, 6, 'Ca Sáng', 100, 80, 20, 1000000, 2000000, 100000, 3100000]
    ]);
    const parsed = parseExcelFile({ filename: 'báo cáo doanh thu tại cửa hàng.xlsx', buffer });
    expect(parsed.loaiDuLieu).toBe('Doanh thu cửa hàng');
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].sheetDich).toBe(SHEET_NAMES.DL_DOANH_THU_CUA_HANG);
    expect(parsed.rows[0].data['Doanh thu bán hàng thực']).toBe(3000000);
  });

  it('parses cashbook file into DL_SO_QUY rows', () => {
    const buffer = workbookBuffer('SoQuy', [
      ['Mã phiếu', 'Thời gian', 'Loại thu chi', 'Người nộp/nhận', 'Giá trị'],
      ['TTM001', '01/06/2026', 'Phiếu thu Doanh thu Tiền mặt - Làng NVT', '', 500000]
    ]);
    const parsed = parseExcelFile({ filename: 'SoQuy.xlsx', buffer });
    expect(parsed.loaiDuLieu).toBe('Sổ quỹ');
    expect(parsed.rows[0].sheetDich).toBe(SHEET_NAMES.DL_SO_QUY);
    expect(parsed.rows[0].data['Loại giao dịch']).toBe('Thu');
  });

  it('parses inventory file and marks negative stock', () => {
    const buffer = workbookBuffer('Kho', [
      ['Nhóm quản lý', 'Nhóm hàng (3 Cấp)', 'Mã hàng', 'Tên hàng', 'Giá vốn', 'Tồn kho hiện tại', 'Định mức tồn nhỏ nhất', 'Định mức tồn lớn nhất', 'ĐVT'],
      ['Món sản xuất', 'Nguyên liệu', 'SP001', 'Thịt cốt lết', 100000, -2, 0, 999999999, 'kg']
    ]);
    const parsed = parseExcelFile({ filename: 'DanhSachKhoHang.xlsx', buffer });
    expect(parsed.loaiDuLieu).toBe('Tồn kho');
    expect(parsed.rows[0].sheetDich).toBe(SHEET_NAMES.DL_TON_KHO);
    expect(parsed.rows[0].data['Trạng thái tồn âm']).toBe('Tồn âm');
  });
});
