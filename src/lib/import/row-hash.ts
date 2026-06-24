import crypto from 'node:crypto';

export function createRowHash(row: Record<string, unknown>): string {
  const normalized = Object.keys(row)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = row[key];
      return acc;
    }, {});
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}
