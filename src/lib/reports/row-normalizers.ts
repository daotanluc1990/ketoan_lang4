export type DataRow = Record<string, unknown>;

export function toText(value: unknown) {
  return String(value ?? '').trim();
}

export function normalizeText(value: unknown) {
  return toText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function pickText(row: DataRow, columns: string[]) {
  for (const column of columns) {
    const value = toText(row[column]);
    if (value) return value;
  }
  return '';
}

export function pickNumber(row: DataRow, columns: string[]) {
  for (const column of columns) {
    const value = toNumber(row[column]);
    if (value !== 0) return value;
  }
  return 0;
}

export function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = toText(value)
    .replace(/đ/g, '')
    .replace(/%/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '');
  const number = Number(raw);
  return Number.isFinite(number) ? number : 0;
}

export function toRatio(value: unknown) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return 0;
  return Math.abs(number) > 1 ? number / 100 : number;
}

export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return startOfDay(value);
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Google/Excel serial date: day 1 = 1899-12-31, Excel has the 1900 leap-year bug.
    const utc = Date.UTC(1899, 11, 30) + value * 24 * 60 * 60 * 1000;
    const date = new Date(utc);
    return Number.isNaN(date.getTime()) ? null : startOfDay(date);
  }

  const text = toText(value);
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return createDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));

  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    let year = Number(slashMatch[3]);
    if (year < 100) year += 2000;
    return createDate(year, month, day);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function createDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toIsoDate(value: unknown) {
  const date = parseDateValue(value);
  return date ? date.toISOString().slice(0, 10) : '';
}

export function isDateWithin(value: unknown, fromDate?: string, toDate?: string) {
  const rowDate = parseDateValue(value);
  if (!rowDate) return !(fromDate || toDate);
  const from = fromDate ? parseDateValue(fromDate) : null;
  const to = toDate ? parseDateValue(toDate) : null;
  if (from && rowDate < from) return false;
  if (to && rowDate > to) return false;
  return true;
}

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => toText(value)).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'));
}
