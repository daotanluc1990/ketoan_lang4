import { GOOGLE_SHEETS_SCHEMA } from '../src/lib/google-sheets/schema';
import { createRecordKey } from '../src/lib/import/record-key';
import { createRowHash } from '../src/lib/import/row-hash';

if (GOOGLE_SHEETS_SCHEMA.length < 21) {
  throw new Error('Schema chưa đủ 21 sheet theo blueprint V4.5.1.');
}

const key = createRecordKey(['APP_REVENUE', 'NVT', '2026-06-01', 'GRAB']);
const hash = createRowHash({ 'Doanh thu ròng': 1000000, 'Số đơn': 20 });

if (!key.includes('APP_REVENUE|NVT')) throw new Error('Record key lỗi.');
if (!hash || hash.length < 20) throw new Error('Row hash lỗi.');

console.log('Smoke test OK: schema + import hash foundation hoạt động.');
