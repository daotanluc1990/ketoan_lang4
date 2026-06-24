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
  healthCheck(): Promise<{ ok: boolean; mode: 'real' | 'missing_env'; spreadsheetIdConfigured: boolean; accessible?: boolean; sheetCount?: number; message: string }>;
};

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const MAX_HEADER_SCAN_ROWS = 10;

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
    const hasKeyColumn = cells.some((cell) => ['mã dòng dữ liệu', 'mã lần import', 'ngày', 'chỉ số', 'mã lần import'].includes(clean(cell)));
    const weightedScore = score + (hasKeyColumn ? 2 : 0);
    if (weightedScore > best.score) best = { index, score: weightedScore, header: cells };
  });

  if (best.index >= 0 && best.score >= 2) return best;
  return { index: -1, score: 0, header: schemaColumns };
}

async function createSheetsApi() {
  const env = getServerEnv();
  if (!hasGoogleSheetsEnv()) {
    throw new Error('Thiếu GOOGLE_SHEET_ID / GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY. Chưa thể kết nối Google Sheet thật.');
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
    range: `'${sheetName}'!A1:ZZ${MAX_HEADER_SCAN_ROWS}`,
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
        range: `'${sheetName}'!A:ZZ`,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });
      const values = (response.data.values ?? []) as unknown[][];
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
