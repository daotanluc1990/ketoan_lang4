import * as XLSX from 'xlsx';

export type ParsedWorkbook = {
  workbook: XLSX.WorkBook;
  firstSheet: XLSX.WorkSheet;
  firstSheetName: string;
};

export function readWorkbook(buffer: Buffer): ParsedWorkbook {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, dense: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('File Excel không có sheet nào.');
  const firstSheet = workbook.Sheets[firstSheetName];
  if (!firstSheet) throw new Error('Không đọc được sheet đầu tiên trong file Excel.');
  return { workbook, firstSheet, firstSheetName };
}

export function sheetToRows(sheet: XLSX.WorkSheet, headerRowIndex = 0): Record<string, unknown>[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true }) as unknown[][];
  const header = (rows[headerRowIndex] ?? []).map((value) => String(value ?? '').trim());
  return rows.slice(headerRowIndex + 1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== '')).map((row) => {
    const record: Record<string, unknown> = {};
    header.forEach((column, index) => {
      if (column) record[column] = row[index] ?? '';
    });
    return record;
  });
}

export function rowsAsMatrix(sheet: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true }) as unknown[][];
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value ?? '')
    .replace(/\s/g, '')
    .replace(/,/g, '')
    .replace(/%/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function toDateString(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const text = String(value ?? '').trim();
  const match = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return text;
}

export function getYear(dateText: string) {
  return Number(dateText.slice(0, 4)) || new Date().getFullYear();
}

export function getMonth(dateText: string) {
  return Number(dateText.slice(5, 7)) || new Date().getMonth() + 1;
}

export function getWeekCode(dateText: string) {
  const date = new Date(`${dateText}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  const temp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function inferBranch(value?: unknown) {
  const text = String(value ?? '').toUpperCase();
  if (text.includes('NVT') || text.includes('NGUYỄN VĂN TĂNG') || text.includes('LANG NVT') || text.includes('LÀNG NVT')) return 'NVT';
  return String(value ?? 'NVT') || 'NVT';
}

export function normalizeChannel(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes('grab')) return 'Grab';
  if (text.includes('spf') || text.includes('shopee')) return 'ShopeeFood';
  if (text.includes('befood') || text.includes('be food')) return 'BeFood';
  if (text.includes('xanh')) return 'Xanh';
  if (text.includes('trực tiếp') || text.includes('tien mat') || text.includes('tiền mặt')) return 'Offline';
  return raw.trim();
}

export function cleanHeader(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}
