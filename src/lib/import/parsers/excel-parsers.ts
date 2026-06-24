import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { createRecordKey } from '@/lib/import/record-key';
import { createRowHash } from '@/lib/import/row-hash';
import type { ImportRow } from '@/lib/import/import-types';
import type { ExcelFileInput, ParsedExcelImport } from './import-parser-types';
import { cleanHeader, getMonth, getWeekCode, getYear, inferBranch, normalizeChannel, readWorkbook, rowsAsMatrix, sheetToRows, toDateString, toNumber } from './excel-utils';

function makeImportRow(sheetDich: string, keyParts: Array<string | number | undefined | null>, data: Record<string, unknown>, errors: string[] = []): ImportRow {
  const maDongDuLieu = createRecordKey([sheetDich, ...keyParts]);
  return {
    maDongDuLieu,
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

function looksLikeStoreRevenue(filename: string, matrix: unknown[][]) {
  const header = (matrix[0] ?? []).map(cleanHeader).join('|').toLowerCase();
  return filename.toLowerCase().includes('doanh thu tại cửa hàng') || (header.includes('tên ch') && header.includes('tổng phần') && header.includes('momo'));
}

function looksLikeCashbook(filename: string, matrix: unknown[][]) {
  const header = (matrix[0] ?? []).map(cleanHeader).join('|').toLowerCase();
  return filename.toLowerCase().includes('soquy') || (header.includes('mã phiếu') && header.includes('loại thu chi') && header.includes('giá trị'));
}

function looksLikeInventory(filename: string, matrix: unknown[][]) {
  const header = (matrix[0] ?? []).map(cleanHeader).join('|').toLowerCase();
  return filename.toLowerCase().includes('danhsachkhohang') || (header.includes('mã hàng') && header.includes('tồn kho hiện tại'));
}

function looksLikeAppRevenue(filename: string, matrix: unknown[][]) {
  const rowText = matrix.slice(0, 8).flat().map(cleanHeader).join('|').toLowerCase();
  return filename.toLowerCase().includes('tong_hop_doanh_thu') || (rowText.includes('tổng hợp doanh thu') && rowText.includes('doanh thu ròng'));
}

function looksLikeLossReport(filename: string, workbookSheetNames: string[], matrix: unknown[][]) {
  const rowText = matrix.slice(0, 8).flat().map(cleanHeader).join('|').toLowerCase();
  return filename.toLowerCase().includes('thất thoát') || workbookSheetNames.some((name) => name.toLowerCase().includes('thất thoát')) || rowText.includes('kiểm soát thất thoát');
}

export function parseStoreRevenueFile(input: ExcelFileInput): ParsedExcelImport {
  const { firstSheet } = readWorkbook(input.buffer);
  const rows = sheetToRows(firstSheet);
  const parsedRows: ImportRow[] = [];
  rows.forEach((row, idx) => {
    const ngay = toDateString(row['Ngày']);
    const tienMat = toNumber(row['Tiền Mặt']);
    const momo = toNumber(row['MoMo']);
    const chiTienMat = toNumber(row['Chi Tiền Mặt']);
    const data = withSource({
      'Ngày': ngay,
      'Năm': getYear(ngay),
      'Tháng': getMonth(ngay),
      'Tuần': getWeekCode(ngay).split('-W')[1] ?? '',
      'Mã tuần': getWeekCode(ngay),
      'Chi nhánh': inferBranch(row['Tên CH']),
      'Ca bán': row['Ca'],
      'Tổng phần': toNumber(row['Tổng Phần']),
      'Số hộp': toNumber(row['Số Hộp']),
      'Số dĩa': toNumber(row['Số Dĩa']),
      'Tiền mặt': tienMat,
      'MoMo/chuyển khoản': momo,
      'Chi tiền mặt': chiTienMat,
      'Tổng doanh thu theo file': toNumber(row['TỔNG DOANH THU']),
      'Doanh thu bán hàng thực': tienMat + momo,
      'Tiền mặt còn lại sau chi': tienMat - chiTienMat,
      'Người import': 'system'
    }, input.filename, idx + 2);
    parsedRows.push(makeImportRow(SHEET_NAMES.DL_DOANH_THU_CUA_HANG, [ngay, String(data['Chi nhánh'] ?? ''), String(data['Ca bán'] ?? '')], data, ngay ? [] : ['Thiếu ngày']));
  });
  return { tenFile: input.filename, loaiDuLieu: 'Doanh thu cửa hàng', chiNhanh: 'NVT', rows: parsedRows, warnings: [] };
}

export function parseCashbookFile(input: ExcelFileInput): ParsedExcelImport {
  const { firstSheet } = readWorkbook(input.buffer);
  const rows = sheetToRows(firstSheet).filter((row) => String(row['Mã phiếu'] ?? '').trim());
  const parsedRows: ImportRow[] = rows.map((row, idx) => {
    const ngay = toDateString(row['Thời gian']);
    const loaiThuChi = String(row['Loại thu chi'] ?? '');
    const giaTri = toNumber(row['Giá trị']);
    const data = withSource({
      'Ngày': ngay,
      'Năm': getYear(ngay),
      'Tháng': getMonth(ngay),
      'Tuần': getWeekCode(ngay).split('-W')[1] ?? '',
      'Mã tuần': getWeekCode(ngay),
      'Chi nhánh': inferBranch(loaiThuChi),
      'Loại giao dịch': giaTri >= 0 ? 'Thu' : 'Chi',
      'Nhóm thu/chi': inferExpenseGroup(loaiThuChi),
      'Diễn giải': loaiThuChi,
      'Số tiền': giaTri,
      'Phương thức': '',
      'Số dư sau giao dịch': '',
      'Người tạo': row['Người tạo'] ?? row['Người nộp/nhận'] ?? ''
    }, input.filename, idx + 2);
    return makeImportRow(SHEET_NAMES.DL_SO_QUY, [String(row['Mã phiếu'] ?? ''), ngay, giaTri], data, row['Mã phiếu'] ? [] : ['Thiếu mã phiếu']);
  });
  return { tenFile: input.filename, loaiDuLieu: 'Sổ quỹ', chiNhanh: 'NVT', rows: parsedRows, warnings: [] };
}

function inferExpenseGroup(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('doanh thu')) return 'Doanh thu';
  if (lower.includes('rau')) return 'Rau củ';
  if (lower.includes('thịt')) return 'Nguyên liệu chính';
  if (lower.includes('lương') || lower.includes('tạm ứng')) return 'Lao động';
  if (lower.includes('gas') || lower.includes('điện') || lower.includes('nước')) return 'Điện/nước/gas';
  if (lower.includes('sửa')) return 'Sửa chữa/bảo trì';
  return 'Khác';
}

export function parseInventoryFile(input: ExcelFileInput): ParsedExcelImport {
  const { firstSheet } = readWorkbook(input.buffer);
  const rows = sheetToRows(firstSheet);
  const today = new Date().toISOString().slice(0, 10);
  const parsedRows: ImportRow[] = rows.map((row, idx) => {
    const ton = toNumber(row['Tồn kho hiện tại']);
    const min = toNumber(row['Định mức tồn nhỏ nhất']);
    const max = toNumber(row['Định mức tồn lớn nhất']);
    const giaVon = toNumber(row['Giá vốn']);
    const data = withSource({
      'Ngày kiểm kê': today,
      'Chi nhánh': 'NVT',
      'Mã hàng': row['Mã hàng'],
      'Tên hàng': row['Tên hàng'],
      'Nhóm hàng': row['Nhóm hàng (3 Cấp)'],
      'Đơn vị tính': row['ĐVT'],
      'Tồn kho': ton,
      'Giá trị tồn': giaVon * ton,
      'Trạng thái tồn âm': ton < 0 ? 'Tồn âm' : 'Không',
      'Định mức tồn tối thiểu': min,
      'Định mức tồn tối đa': max
    }, input.filename, idx + 2);
    return makeImportRow(SHEET_NAMES.DL_TON_KHO, [String(row['Mã hàng'] ?? ''), today], data, row['Mã hàng'] ? [] : ['Thiếu mã hàng']);
  });
  return { tenFile: input.filename, loaiDuLieu: 'Tồn kho', chiNhanh: 'NVT', rows: parsedRows, warnings: [] };
}

function getInventoryStatus(ton: number, min: number, max: number) {
  if (ton < 0) return 'Tồn âm';
  if (min > 0 && ton < min) return 'Dưới min';
  if (max > 0 && max < 999999999 && ton > max) return 'Vượt max';
  return 'OK';
}

export function parseAppRevenueFile(input: ExcelFileInput): ParsedExcelImport {
  const { firstSheet } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);
  const headerRowIndex = matrix.findIndex((row) => row.map(cleanHeader).includes('STT') && row.map(cleanHeader).includes('Ngày'));
  if (headerRowIndex < 0) return { tenFile: input.filename, loaiDuLieu: 'Doanh thu app', chiNhanh: 'NVT', rows: [], warnings: ['Không tìm thấy header doanh thu app.'] };
  const headers = matrix[headerRowIndex].map(cleanHeader);
  const dataRows = matrix.slice(headerRowIndex + 1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));
  const parsedRows: ImportRow[] = [];
  const channelStarts = headers.map((header, index) => ({ header, index })).filter(({ header }) => /doanh thu trước chi phí/i.test(header) && /(grab|spf|xanh|befood)/i.test(header));

  for (const [rowIdx, row] of dataRows.entries()) {
    const ngay = toDateString(row[1]);
    for (const start of channelStarts) {
      const channel = normalizeChannel(start.header);
      const gross = toNumber(row[start.index]);
      const feeText = row[start.index + 1];
      const net = toNumber(row[start.index + 2]);
      const orders = toNumber(row[start.index + 3]);
      const cogs = toNumber(row[start.index + 4]);
      if (!gross && !net && !orders) continue;
      const fees = extractFeeAmount(feeText, gross - net);
      const data = withSource({
        'Ngày': ngay,
        'Năm': getYear(ngay),
        'Tháng': getMonth(ngay),
        'Tuần': getWeekCode(ngay).split('-W')[1] ?? '',
        'Mã tuần': getWeekCode(ngay),
        'Chi nhánh': 'NVT',
        'Kênh bán': channel,
        'Tài khoản app': start.header.split(':')[0],
        'Doanh thu gộp': gross,
        'Tổng khấu trừ/phí': fees,
        'Doanh thu ròng': net,
        'Số đơn': orders,
        'Giá vốn': cogs,
        'Giá trị đơn trung bình': orders ? net / orders : 0,
        'Tỷ lệ phí': gross ? fees / gross : 0
      }, input.filename, headerRowIndex + rowIdx + 2);
      parsedRows.push(makeImportRow(SHEET_NAMES.DL_DOANH_THU_APP, [ngay, channel, start.header.split(':')[0]], data, ngay ? [] : ['Thiếu ngày']));
    }
  }
  return { tenFile: input.filename, loaiDuLieu: 'Doanh thu app', chiNhanh: 'NVT', rows: parsedRows, warnings: channelStarts.length ? [] : ['Không nhận diện được kênh app.'] };
}

function extractFeeAmount(value: unknown, fallback: number) {
  const text = String(value ?? '');
  const amount = toNumber(text.split('/')[0]);
  return amount || fallback || 0;
}

export function parseLossReportFile(input: ExcelFileInput): ParsedExcelImport {
  const { workbook } = readWorkbook(input.buffer);
  const priceMap = buildLossPriceMap(workbook);
  const sheetName = workbook.SheetNames.find((name: string) => name.toLowerCase().includes('bc thất thoát')) ?? workbook.SheetNames.find((name: string) => name === 'FACT_DATA_STORAGE') ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { tenFile: input.filename, loaiDuLieu: 'Thất thoát NVL', chiNhanh: 'NVT', rows: [], warnings: ['Không đọc được sheet thất thoát.'] };
  const matrix = rowsAsMatrix(sheet);
  const headerRowIndex = matrix.findIndex((row) => row.map(cleanHeader).some((cell) => cell.toLowerCase().includes('tên nguyên liệu')));
  const metaRow = matrix[2] ?? [];
  const nam = toNumber(metaRow[3]) || new Date().getFullYear();
  const tuan = toNumber(metaRow[4]);
  const maTuan = String(metaRow[6] ?? '');
  const batDau = toDateString(metaRow[7]);
  const ketThuc = toDateString(metaRow[8]);
  if (headerRowIndex < 0) return parseFactDataStorageLoss(input, workbook);
  const headers = matrix[headerRowIndex].map(cleanHeader);
  const rows = matrix.slice(headerRowIndex + 1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));
  const parsedRows: ImportRow[] = rows.map((row, idx) => {
    const get = (namePart: string) => {
      const index = headers.findIndex((header) => header.toLowerCase().includes(namePart.toLowerCase()));
      return index >= 0 ? row[index] : '';
    };
    const tenNvl = String(row[0] ?? '').trim();
    const tieuHao = toNumber(get('Bán Từ'));
    const tonLyThuyet = toNumber(get('Lý thuyết'));
    const tonThucTe = toNumber(get('Thực tế'));
    const chenh = toNumber(get('Chênh lệch'));
    const tiLe = toNumber(get('Tỉ lệ')) || (tieuHao ? chenh / tieuHao : 0);
    const donGia = priceMap.get(tenNvl.toLowerCase()) ?? 0;
    const data = withSource({
      'Chi nhánh': 'NVT',
      'Năm': nam,
      'Tuần': tuan,
      'Mã tuần': maTuan || (batDau ? getWeekCode(batDau) : ''),
      'Tuần bắt đầu': batDau,
      'Tuần kết thúc': ketThuc,
      'Tên nguyên vật liệu': tenNvl,
      'Loại nguyên vật liệu': row[1] ?? '',
      'Đơn vị tính': row[2] ?? '',
      'Tồn đầu kỳ': toNumber(row[3]),
      'Nhập trong kỳ': toNumber(row[4]),
      'Nhập từ bếp trung tâm': toNumber(row[4]),
      'Nhập từ nhà cung cấp': 0,
      'Tiêu hao lý thuyết theo bán hàng': tieuHao,
      'Tồn cuối kỳ lý thuyết': tonLyThuyet,
      'Tồn cuối kỳ thực tế': tonThucTe,
      'Tồn cuối từ sổ': '',
      'Chênh lệch số lượng': chenh,
      'Loại chênh lệch': chenh > 0 ? 'Thiếu/thất thoát' : chenh < 0 ? 'Dư/cần kiểm tra' : 'Khớp',
      'Đơn giá': donGia,
      'Giá trị chênh lệch': chenh * donGia,
      'Tỷ lệ thất thoát': tiLe,
      'Định mức cho phép': '',
      'Mức vượt định mức': '',
      'Trạng thái': Math.abs(tiLe) > 0.05 ? 'Cảnh báo' : 'Tốt',
      'Ghi chú': get('Ghi chú')
    }, input.filename, headerRowIndex + idx + 2);
    return makeImportRow(SHEET_NAMES.DL_THAT_THOAT_NVL, [maTuan, tenNvl], data, tenNvl ? [] : ['Thiếu tên NVL']);
  });
  return { tenFile: input.filename, loaiDuLieu: 'Thất thoát NVL', chiNhanh: 'NVT', rows: parsedRows, warnings: [] };
}


function buildLossPriceMap(workbook: ReturnType<typeof readWorkbook>['workbook']) {
  const sheet = workbook.Sheets['DATA GIÁ VỐN NVL'];
  const map = new Map<string, number>();
  if (!sheet) return map;
  const matrix = rowsAsMatrix(sheet);
  const headerRowIndex = matrix.findIndex((row) => row.map(cleanHeader).includes('Tên hàng') && row.map(cleanHeader).includes('Đơn giá'));
  if (headerRowIndex < 0) return map;
  const headers = matrix[headerRowIndex].map(cleanHeader);
  const nameIndex = headers.findIndex((h) => h === 'Tên hàng');
  const priceIndex = headers.findIndex((h) => h === 'Đơn giá');
  for (const row of matrix.slice(headerRowIndex + 1)) {
    const name = String(row[nameIndex] ?? '').trim();
    if (!name) continue;
    map.set(name.toLowerCase(), toNumber(row[priceIndex]));
  }
  return map;
}

function parseFactDataStorageLoss(input: ExcelFileInput, workbook: ReturnType<typeof readWorkbook>['workbook']): ParsedExcelImport {
  const sheet = workbook.Sheets['FACT_DATA_STORAGE'];
  if (!sheet) return { tenFile: input.filename, loaiDuLieu: 'Thất thoát NVL', chiNhanh: 'NVT', rows: [], warnings: ['Không tìm thấy FACT_DATA_STORAGE.'] };
  const rows = sheetToRows(sheet);
  const parsedRows = rows.map((row, idx) => {
    const tenNvl = String(row['tenNvl'] ?? '').trim();
    const thatThoatSl = toNumber(row['thatThoatSL']);
    const data = withSource({
      'Chi nhánh': row['chiNhanh'] ?? 'NVT',
      'Năm': row['nam'],
      'Tháng': row['thang'],
      'Tên nguyên vật liệu': tenNvl,
      'Tồn đầu kỳ': row['tonDau'],
      'Nhập trong kỳ': row['nhap'],
      'Tiêu hao lý thuyết theo bán hàng': row['tieuHao'],
      'Tồn cuối kỳ lý thuyết': row['tonCuoiLyThuyet'],
      'Tồn cuối kỳ thực tế': row['tonCuoiThucTe'],
      'Chênh lệch số lượng': thatThoatSl,
      'Loại chênh lệch': thatThoatSl > 0 ? 'Thiếu/thất thoát' : thatThoatSl < 0 ? 'Dư/cần kiểm tra' : 'Khớp',
      'Đơn giá': row['donGia'],
      'Giá trị chênh lệch': row['thatThoatTien'],
      'Trạng thái': Math.abs(toNumber(row['thatThoatTien'])) > 1000000 ? 'Cảnh báo' : 'Tốt'
    }, input.filename, idx + 2);
    return makeImportRow(SHEET_NAMES.DL_THAT_THOAT_NVL, [String(row['nam'] ?? ''), String(row['thang'] ?? ''), tenNvl], data, tenNvl ? [] : ['Thiếu tên NVL']);
  });
  return { tenFile: input.filename, loaiDuLieu: 'Thất thoát NVL', chiNhanh: 'NVT', rows: parsedRows, warnings: [] };
}

export function parseExcelFile(input: ExcelFileInput): ParsedExcelImport {
  const { workbook, firstSheet } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);
  if (looksLikeStoreRevenue(input.filename, matrix)) return parseStoreRevenueFile(input);
  if (looksLikeCashbook(input.filename, matrix)) return parseCashbookFile(input);
  if (looksLikeInventory(input.filename, matrix)) return parseInventoryFile(input);
  if (looksLikeAppRevenue(input.filename, matrix)) return parseAppRevenueFile(input);
  if (looksLikeLossReport(input.filename, workbook.SheetNames, matrix)) return parseLossReportFile(input);
  return { tenFile: input.filename, loaiDuLieu: 'Không nhận diện được', chiNhanh: 'NVT', rows: [], warnings: ['Không nhận diện được loại file. Cần kiểm tra thủ công.'] };
}
