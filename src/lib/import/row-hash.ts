import crypto from 'node:crypto';

const VOLATILE_IMPORT_FIELDS = new Set([
  'Mã lần import',
  'Dấu vết file',
  'Dấu vết dòng',
  'Trạng thái dữ liệu',
  'Ngày import',
  'Người import'
]);

export function createRowHash(row: Record<string, unknown>): string {
  const normalized = Object.keys(row)
    .filter((key) => !VOLATILE_IMPORT_FIELDS.has(key))
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = row[key];
      return acc;
    }, {});
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}
