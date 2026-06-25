import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { createRecordKey } from '@/lib/import/record-key';
import { createRowHash } from '@/lib/import/row-hash';
import type { ImportRow } from '@/lib/import/import-types';
import type { ExcelFileInput, ParsedExcelImport } from './import-parser-types';
import { cleanHeader, getMonth, getWeekCode, getYear, inferBranch, normalizeChannel, readWorkbook, sheetToRows, toDateString, toNumber } from './excel-utils';

function makeImportRow(sheetDich: string, keyParts: Array<string | number | undefined | null>, data: Record<string, unknown>, errors: string[] = []): ImportRow {
  return {
    maDongDuLieu: createRecordKey([sheetDich, ...keyParts]),
    dauVetDong: createRowHash(data),
    sheetDich,
    data,
    errors
  };
}

function withSource(data: Record<string, unknown>, filename: string, rowIndex: number): Record<string, unknown> {
  return {
    ...data,
    'Tên file nguồn': filename,
    'Dấu vết dòng': `${filename}#${rowIndex}`,
    'Trạng thái dữ liệu': 'Preview',
    'Ngày import': new Date().toISOString()
  };
}

export function looksLikeOperationalCashbook(filename: string, matrix: unknown[][]) {
  const header = (matrix[0] ?? []).map(cleanHeader).join('|').toLowerCase();
  return filename.toLowerCase().includes('soquy') || (header.includes('mã phiếu') && header.includes('loại thu chi') && header.includes('giá trị'));
}

function inferArea(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('bếp trung tâm') || lower.includes('bep trung tam') || lower.includes('chi nhánh trung tâm') || lower.includes('chi nhanh trung tam')) return 'Bếp Trung Tâm';
  if (lower.includes('nvt') || lower.includes('nguyễn văn tăng') || lower.includes('lang nvt') || lower.includes('làng nvt')) return 'NVT';
  return inferBranch(text);
}

function inferRevenueType(text: string, amount: number) {
  const lower = text.toLowerCase();
  if (amount <= 0) return '';
  if (lower.includes('doanh thu')) return 'Doanh thu bán hàng';
  if (lower.includes('khách trả') || lower.includes('khach tra')) return 'Thu khác';
  return 'Thu khác';
}

function inferExpenseGroup(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('doanh thu')) return 'Doanh thu';
  if (lower.includes('khách trả') || lower.includes('khach tra')) return 'Thu khác';
  if (lower.includes('trả ncc') || lower.includes('tra ncc') || lower.includes('công nợ') || lower.includes('cong no')) return 'Trả NCC/công nợ';
  if (lower.includes('rau')) return 'Rau củ';
  if (lower.includes('thịt') || lower.includes('nvl') || lower.includes('nguyên liệu')) return 'Nguyên liệu chính';
  if (lower.includes('lương') || lower.includes('tạm ứng')) return 'Lao động';
  if (lower.includes('gas') || lower.includes('điện') || lower.includes('nước')) return 'Điện/nước/gas';
  if (lower.includes('sửa')) return 'Sửa chữa/bảo trì';
  return 'Khác';
}

function inferPnlClass(text: string, amount: number, area: string) {
  const lower = text.toLowerCase();
  if (amount > 0) return inferRevenueType(text, amount);
  if (lower.includes('trả ncc') || lower.includes('tra ncc') || lower.includes('công nợ') || lower.includes('cong no') || lower.includes('thanh toán ncc') || lower.includes('thanh toan ncc')) return 'Trả NCC/công nợ';
  if (lower.includes('đầu tư') || lower.includes('dau tu') || lower.includes('máy móc') || lower.includes('may moc') || lower.includes('thiết bị') || lower.includes('thiet bi')) return 'Capex';
  if (area === 'Bếp Trung Tâm') return 'Chi Bếp Trung Tâm';
  if (area === 'NVT') return 'Chi cửa hàng';
  return 'Cần phân loại';
}

export function parseOperationalCashbookFile(input: ExcelFileInput): ParsedExcelImport {
  const { firstSheet } = readWorkbook(input.buffer);
  const rows = sheetToRows(firstSheet).filter((row) => String(row['Mã phiếu'] ?? '').trim());
  const parsedRows: ImportRow[] = rows.map((row, idx) => {
    const ngay = toDateString(row['Thời gian']);
    const loaiThuChi = String(row['Loại thu chi'] ?? '');
    const note = String(row['Ghi chú'] ?? row['Nội dung'] ?? '');
    const description = `${loaiThuChi} ${note}`.trim();
    const giaTri = toNumber(row['Giá trị']);
    const area = inferArea(description);
    const data = withSource({
      'Mã phiếu': row['Mã phiếu'],
      'Ngày': ngay,
      'Năm': getYear(ngay),
      'Tháng': getMonth(ngay),
      'Tuần': getWeekCode(ngay).split('-W')[1] ?? '',
      'Mã tuần': getWeekCode(ngay),
      'Chi nhánh': area,
      'Khu vực': area,
      'Loại giao dịch': giaTri >= 0 ? 'Thu' : 'Chi',
      'Nhóm thu/chi': inferExpenseGroup(loaiThuChi),
      'Kênh thu': giaTri > 0 ? normalizeChannel(loaiThuChi) : '',
      'Loại thu': inferRevenueType(loaiThuChi, giaTri),
      'Diễn giải': loaiThuChi,
      'Ghi chú': note,
      'Số tiền': giaTri,
      'Phương thức': String(row['Phương thức'] ?? ''),
      'Số dư sau giao dịch': row['Tồn quỹ'] ?? row['Số dư sau giao dịch'] ?? '',
      'Người tạo': row['Người tạo'] ?? row['Người nộp/nhận'] ?? '',
      'Phân loại P&L': inferPnlClass(description, giaTri, area)
    }, input.filename, idx + 2);
    return makeImportRow(SHEET_NAMES.DL_SO_QUY, [String(row['Mã phiếu'] ?? ''), ngay, giaTri], data, row['Mã phiếu'] ? [] : ['Thiếu mã phiếu']);
  });

  return { tenFile: input.filename, loaiDuLieu: 'Sổ quỹ', chiNhanh: 'NVT', rows: parsedRows, warnings: [] };
}
