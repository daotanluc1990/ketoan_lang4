import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { createRecordKey } from '@/lib/import/record-key';
import { createRowHash } from '@/lib/import/row-hash';
import type { ImportRow } from '@/lib/import/import-types';
import type { ExcelFileInput, ParsedExcelImport } from './import-parser-types';
import { cleanHeader, getMonth, getWeekCode, getYear, inferBranch, readWorkbook, rowsAsMatrix, toDateString, toNumber } from './excel-utils';

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

function topText(matrix: unknown[][]) {
  return matrix.slice(0, 25).flat().map(cleanHeader).join('|').toLowerCase();
}

function headersOf(row: unknown[]) {
  return row.map(cleanHeader);
}

function findHeaderRow(matrix: unknown[][], required: string[]) {
  return matrix.findIndex((row) => {
    const headers = headersOf(row).map((header) => header.toLowerCase());
    return required.every((part) => headers.some((header) => header.includes(part.toLowerCase())));
  });
}

function byHeader(headers: string[], row: unknown[], candidates: string[]) {
  const index = headers.findIndex((header) => candidates.some((candidate) => header.toLowerCase().includes(candidate.toLowerCase())));
  return index >= 0 ? row[index] : '';
}

function extractUnit(name: string) {
  const open = name.lastIndexOf('(');
  const close = name.lastIndexOf(')');
  if (open >= 0 && close > open) return name.slice(open + 1, close).trim();
  return '';
}

function extractDateRange(matrix: unknown[][]) {
  const cells = matrix.slice(0, 20).flat().map((cell) => String(cell ?? ''));
  const found: string[] = [];
  for (const cell of cells) {
    const parts = cell.split(' ');
    for (const part of parts) {
      const normalized = part.trim().replace(/[.,;:]/g, '');
      const pieces = normalized.includes('/') ? normalized.split('/') : normalized.split('-');
      if (pieces.length === 3 && pieces[2]?.length === 4) found.push(toDateString(normalized));
    }
  }
  const start = found[0] ?? '';
  const end = found[1] ?? start;
  return { start, end };
}

function metaValue(matrix: unknown[][], label: string, fallback: string) {
  const target = label.toLowerCase();
  for (const row of matrix.slice(0, 20)) {
    const cells = row.map((cell) => String(cell ?? '').trim());
    for (let i = 0; i < cells.length; i += 1) {
      const lower = cells[i].toLowerCase();
      if (!lower.includes(target)) continue;
      const afterColon = cells[i].split(':').slice(1).join(':').trim();
      if (afterColon) return afterColon;
      if (cells[i + 1]) return cells[i + 1];
    }
  }
  return fallback;
}

export function looksLikeCentralKitchenIssue(filename: string, matrix: unknown[][]) {
  const text = topText(matrix);
  return filename.toLowerCase().includes('productbydamageitem') || filename.toLowerCase().includes('xuất hủy') || (text.includes('báo cáo hàng hóa xuất hủy') && text.includes('tổng sl hủy'));
}

export function looksLikeCentralKitchenInventory(filename: string, matrix: unknown[][]) {
  const text = topText(matrix);
  return filename.toLowerCase().includes('tồn kho bếp') || (text.includes('xuất nhập tồn') && (text.includes('bếp trung tâm') || text.includes('chi nhánh trung tâm')));
}

export function looksLikeDebtReport(filename: string, matrix: unknown[][]) {
  const text = topText(matrix);
  return filename.toLowerCase().includes('công nợ') || (text.includes('ghi nợ') && text.includes('ghi có') && text.includes('nợ cuối'));
}

export function parseCentralKitchenIssueFile(input: ExcelFileInput): ParsedExcelImport {
  const { firstSheet } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);
  const headerRowIndex = findHeaderRow(matrix, ['mã hàng', 'tổng sl hủy']);
  if (headerRowIndex < 0) return { tenFile: input.filename, loaiDuLieu: 'Xuất kho bếp trung tâm', chiNhanh: 'NVT', rows: [], warnings: ['Không tìm thấy header xuất kho bếp trung tâm.'] };

  const headers = headersOf(matrix[headerRowIndex]);
  const { start, end } = extractDateRange(matrix);
  const maTuan = start ? getWeekCode(start) : '';
  const receivingBranch = inferBranch(metaValue(matrix, 'Cửa hàng', 'NVT'));
  const issuingBranch = inferBranch(metaValue(matrix, 'Chi nhánh', 'Chi nhánh trung tâm'));
  const bodyRows = matrix.slice(headerRowIndex + 1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));

  const rows = bodyRows.map((row, idx) => {
    const maHang = String(byHeader(headers, row, ['Mã hàng']) ?? '').trim();
    const tenHang = String(byHeader(headers, row, ['Tên hàng']) ?? '').trim();
    const soLuong = toNumber(byHeader(headers, row, ['Tổng SL hủy', 'SL hủy']));
    const giaTri = toNumber(byHeader(headers, row, ['Tổng giá trị', 'Giá trị']));
    const data = withSource({
      'Kỳ báo cáo': start && end ? `${start} - ${end}` : '',
      'Năm': getYear(start || end),
      'Tháng': getMonth(start || end),
      'Tuần': maTuan.split('-W')[1] ?? '',
      'Mã tuần': maTuan,
      'Ngày bắt đầu': start,
      'Ngày kết thúc': end,
      'Chi nhánh xuất': issuingBranch,
      'Chi nhánh nhận': receivingBranch,
      'Mã hàng': maHang,
      'Tên hàng': tenHang,
      'Loại hàng': '',
      'Đơn vị tính': extractUnit(tenHang),
      'Số lượng xuất': soLuong,
      'Tổng giá trị xuất': giaTri,
      'Đơn giá tạm tính': soLuong ? giaTri / soLuong : 0,
      'Nguồn nghiệp vụ': 'Xuất hủy KiotViet = Xuất kho cho chi nhánh',
      'Ghi chú': 'Theo quy ước Cơm Tấm Làng: xuất hủy là xuất kho cho chi nhánh.'
    }, input.filename, headerRowIndex + idx + 2);
    return makeImportRow(SHEET_NAMES.DL_XUAT_KHO_BEP_TRUNG_TAM, [maTuan, receivingBranch, maHang || tenHang], data, maHang || tenHang ? [] : ['Thiếu mã/tên hàng']);
  });

  return { tenFile: input.filename, loaiDuLieu: 'Xuất kho bếp trung tâm', chiNhanh: receivingBranch, rows, warnings: [] };
}

export function parseCentralKitchenInventoryFile(input: ExcelFileInput): ParsedExcelImport {
  const { firstSheet } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);
  const headerRowIndex = findHeaderRow(matrix, ['mã hàng', 'tồn cuối']);
  if (headerRowIndex < 0) return { tenFile: input.filename, loaiDuLieu: 'Tồn kho bếp trung tâm', chiNhanh: 'Bếp Trung Tâm', rows: [], warnings: ['Không tìm thấy header tồn kho bếp trung tâm.'] };

  const headers = headersOf(matrix[headerRowIndex]);
  const { start, end } = extractDateRange(matrix);
  const maTuan = start ? getWeekCode(start) : '';
  const branch = inferBranch(metaValue(matrix, 'Chi nhánh', 'Bếp Trung Tâm'));
  const bodyRows = matrix.slice(headerRowIndex + 1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));

  const rows = bodyRows.map((row, idx) => {
    const maHang = String(byHeader(headers, row, ['Mã hàng']) ?? '').trim();
    const tenHang = String(byHeader(headers, row, ['Tên hàng']) ?? '').trim();
    const tonCuoi = toNumber(byHeader(headers, row, ['Tồn cuối', 'SL cuối']));
    const data = withSource({
      'Kỳ báo cáo': start && end ? `${start} - ${end}` : '',
      'Năm': getYear(start || end),
      'Tháng': getMonth(start || end),
      'Tuần': maTuan.split('-W')[1] ?? '',
      'Mã tuần': maTuan,
      'Ngày bắt đầu': start,
      'Ngày kết thúc': end,
      'Chi nhánh': branch,
      'Mã hàng': maHang,
      'Tên hàng': tenHang,
      'Nhóm hàng': byHeader(headers, row, ['Nhóm hàng']),
      'Đơn vị tính': String(byHeader(headers, row, ['ĐVT', 'Đơn vị']) || extractUnit(tenHang)),
      'Tồn đầu kỳ': toNumber(byHeader(headers, row, ['Tồn đầu'])),
      'Nhập trong kỳ': toNumber(byHeader(headers, row, ['SL nhập', 'Nhập trong kỳ', 'Nhập'])),
      'Xuất trong kỳ': toNumber(byHeader(headers, row, ['SL xuất', 'Xuất trong kỳ', 'Xuất'])),
      'Tồn cuối kỳ': tonCuoi,
      'Giá trị tồn đầu': toNumber(byHeader(headers, row, ['Giá trị đầu', 'GT đầu'])),
      'Giá trị nhập': toNumber(byHeader(headers, row, ['Giá trị nhập', 'GT nhập'])),
      'Giá trị xuất': toNumber(byHeader(headers, row, ['Giá trị xuất', 'GT xuất'])),
      'Giá trị tồn cuối': toNumber(byHeader(headers, row, ['Giá trị cuối', 'GT cuối', 'Giá trị tồn cuối'])),
      'Trạng thái tồn âm': tonCuoi < 0 ? 'Tồn âm' : 'Không',
      'Ghi chú': tonCuoi < 0 ? 'Cần rà soát nhập/xuất kho bếp trung tâm' : ''
    }, input.filename, headerRowIndex + idx + 2);
    return makeImportRow(SHEET_NAMES.DL_TON_KHO_BEP_TRUNG_TAM, [maTuan, maHang || tenHang], data, maHang || tenHang ? [] : ['Thiếu mã/tên hàng']);
  });

  return { tenFile: input.filename, loaiDuLieu: 'Tồn kho bếp trung tâm', chiNhanh: branch, rows, warnings: [] };
}

export function parseDebtFile(input: ExcelFileInput): ParsedExcelImport {
  const { firstSheet } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);
  const headerRowIndex = matrix.findIndex((row) => {
    const headers = headersOf(row).map((header) => header.toLowerCase());
    return headers.some((header) => header.includes('ghi nợ')) && headers.some((header) => header.includes('ghi có'));
  });
  if (headerRowIndex < 0) return { tenFile: input.filename, loaiDuLieu: 'Công nợ', chiNhanh: 'Toàn hệ thống', rows: [], warnings: ['Không tìm thấy header công nợ.'] };

  const headers = headersOf(matrix[headerRowIndex]);
  const { start, end } = extractDateRange(matrix);
  const maTuan = start ? getWeekCode(start) : '';
  const bodyRows = matrix.slice(headerRowIndex + 1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));

  const rows = bodyRows.map((row, idx) => {
    const ncc = String(byHeader(headers, row, ['Nhà cung cấp', 'Khách hàng', 'Đối tượng', 'Tên']) ?? '').trim();
    const ghiNo = toNumber(byHeader(headers, row, ['Ghi nợ']));
    const ghiCo = toNumber(byHeader(headers, row, ['Ghi có']));
    const noCuoi = toNumber(byHeader(headers, row, ['Nợ cuối']));
    const data = withSource({
      'Ngày': start,
      'Năm': getYear(start || end),
      'Tháng': getMonth(start || end),
      'Tuần': maTuan.split('-W')[1] ?? '',
      'Mã tuần': maTuan,
      'Chi nhánh': 'Toàn hệ thống',
      'Nhà cung cấp/Đối tượng': ncc,
      'Nhóm công nợ': 'NCC',
      'Nợ đầu kỳ': toNumber(byHeader(headers, row, ['Nợ đầu'])),
      'Ghi nợ': ghiNo,
      'Ghi có': ghiCo,
      'Phải trả': ghiNo,
      'Đã trả': ghiCo,
      'Còn phải trả': noCuoi,
      'Đến hạn': end,
      'Quá hạn': '',
      'Cần CEO duyệt': noCuoi > 0 ? 'Cần theo dõi' : 'Không',
      'Ghi chú': start && end ? `Kỳ ${start} - ${end}` : ''
    }, input.filename, headerRowIndex + idx + 2);
    return makeImportRow(SHEET_NAMES.DL_CONG_NO, [maTuan, ncc], data, ncc && !ncc.toLowerCase().includes('tổng') ? [] : ['Thiếu hoặc không phải dòng NCC']);
  });

  return { tenFile: input.filename, loaiDuLieu: 'Công nợ', chiNhanh: 'Toàn hệ thống', rows, warnings: [] };
}
