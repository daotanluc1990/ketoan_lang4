import { auth, sheets } from '@googleapis/sheets';
import { GOOGLE_SHEETS_SCHEMA } from './schema';
import { getServerEnv, hasGoogleSheetsEnv } from '@/lib/env/server-env';

export type SheetAppendRequest = {
  sheetName: string;
  rows: Record<string, unknown>[];
};

export type SheetsClient = {
  appendRows(request: SheetAppendRequest): Promise<void>;
  readRows(sheetName: string): Promise<Record<string, unknown>[]>;
  readRowsBatch(sheetNames: string[]): Promise<Record<string, Record<string, unknown>[]>>;
  healthCheck(): Promise<{ ok: boolean; mode: 'real' | 'missing_env'; spreadsheetIdConfigured: boolean; accessible?: boolean; sheetCount?: number; message: string }>;
};

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const MAX_HEADER_SCAN_ROWS = 10;
const MIN_READ_COLUMNS = 12;

function getSchemaColumns(sheetName: string) {
  return GOOGLE_SHEETS_SCHEMA.find((sheet) => sheet.sheetName === sheetName)?.columns ?? [];
}

function columnNumberToLetter(columnNumber: number) {
  let num = columnNumber;
  let letters = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    num = Math.floor((num - 1) / 26);
  }
  return letters || 'A';
}

function endColumnForSheet(sheetName: string) {
  return columnNumberToLetter(Math.max(getSchemaColumns(sheetName).length, MIN_READ_COLUMNS));
}

function rowRange(sheetName: string) {
  return `'${sheetName}'!A:${endColumnForSheet(sheetName)}`;
}

function headerRange(sheetName: string) {
  return `'${sheetName}'!A1:${endColumnForSheet(sheetName)}${MAX_HEADER_SCAN_ROWS}`;
}

function normalizeCell(value: unknown) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function clean(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function detectHeader(values: unknown[][], sheetName: string) {
  const schemaColumns = getSchemaColumns(sheetName);
  const schemaSet = new Set(schemaColumns.map(clean));
  let best = { index: -1, score: 0, header: [] as string[] };

  values.slice(0, MAX_HEADER_SCAN_ROWS).forEach((row, index) => {
    const cells = row.map(String).map((value) => value.trim()).filter(Boolean);
    if (!cells.length) return;
    const score = cells.reduce((total, cell) => total + (schemaSet.has(clean(cell)) ? 1 : 0), 0);
    const hasKeyColumn = cells.some((cell) => ['mã dòng dữ liệu', 'mã lần import', 'ngày', 'chỉ số'].includes(clean(cell)));
    const weightedScore = score + (hasKeyColumn ? 2 : 0);
    if (weightedScore > best.score) best = { index, score: weightedScore, header: cells };
  });

  if (best.index >= 0 && best.score >= 2) return best;
  return { index: -1, score: 0, header: schemaColumns };
}

async function createSheetsApi() {
  const env = getServerEnv();
  if (!hasGoogleSheetsEnv()) {
    throw new Error('Thiếu cấu hình Google Sheets. Chưa thể kết nối dữ liệu thật.');
  }
  const googleAuth = new auth.GoogleAuth({
    credentials: {
      client_email: env.googleClientEmail,
      private_key: env.googlePrivateKey
    },
    scopes: SCOPES
  });
  const authClient = await googleAuth.getClient();
  return {
    spreadsheetId: env.googleSheetId as string,
    api: sheets({ version: 'v4', auth: authClient as never })
  };
}

async function readHeader(sheetName: string) {
  const { api, spreadsheetId } = await createSheetsApi();
  const response = await api.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange(sheetName),
    valueRenderOption: 'FORMATTED_VALUE'
  });
  const values = (response.data.values ?? []) as unknown[][];
  const detected = detectHeader(values, sheetName);
  if (!detected.header.length) throw new Error(`Sheet ${sheetName} chưa có header và không có schema fallback.`);
  return detected.header;
}

function rowHasContent(row: unknown[]) {
  return row.some((cell) => String(cell ?? '').trim() !== '');
}

function mapRows(sheetName: string, values: unknown[][]) {
  const detected = detectHeader(values, sheetName);
  const header = detected.header.length ? detected.header : getSchemaColumns(sheetName);
  const dataStartIndex = detected.index >= 0 ? detected.index + 1 : 1;
  return values.slice(dataStartIndex).filter(rowHasContent).map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    header.forEach((column, index) => {
      obj[column] = row[index] ?? '';
    });
    return obj;
  });
}

export function createSheetsClient(): SheetsClient {
  return {
    async appendRows({ sheetName, rows }) {
      if (!rows.length) return;
      const { api, spreadsheetId } = await createSheetsApi();
      const header = await readHeader(sheetName);
      const values = rows.map((row) => header.map((column) => normalizeCell(row[column])));
      const endColumn = columnNumberToLetter(header.length);
      await api.spreadsheets.values.append({
        spreadsheetId,
        range: `'${sheetName}'!A:${endColumn}`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values }
      });
    },

    async readRows(sheetName) {
      const { api, spreadsheetId } = await createSheetsApi();
      const response = await api.spreadsheets.values.get({
        spreadsheetId,
        range: rowRange(sheetName),
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });
      return mapRows(sheetName, (response.data.values ?? []) as unknown[][]);
    },

    async readRowsBatch(sheetNames) {
      const uniqueSheetNames = Array.from(new Set(sheetNames));
      if (!uniqueSheetNames.length) return {};
      const { api, spreadsheetId } = await createSheetsApi();
      const response = await api.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: uniqueSheetNames.map(rowRange),
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });
      const result: Record<string, Record<string, unknown>[]> = {};
      uniqueSheetNames.forEach((sheetName, index) => {
        const values = (response.data.valueRanges?.[index]?.values ?? []) as unknown[][];
        result[sheetName] = mapRows(sheetName, values);
      });
      return result;
    },

    async healthCheck() {
      const env = getServerEnv();
      if (!hasGoogleSheetsEnv()) {
        return {
          ok: false,
          mode: 'missing_env',
          spreadsheetIdConfigured: Boolean(env.googleSheetId),
          message: 'Thiếu biến môi trường Google Sheets. Chưa thể test kết nối thật.'
        };
      }
      try {
        const { api, spreadsheetId } = await createSheetsApi();
        const response = await api.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
        return {
          ok: true,
          mode: 'real',
          spreadsheetIdConfigured: true,
          accessible: true,
          sheetCount: response.data.sheets?.length ?? 0,
          message: 'Kết nối Google Sheet thật thành công.'
        };
      } catch (error) {
        return {
          ok: false,
          mode: 'real',
          spreadsheetIdConfigured: true,
          accessible: false,
          message: error instanceof Error ? error.message : 'Không thể kết nối Google Sheet.'
        };
      }
    }
  };
}
