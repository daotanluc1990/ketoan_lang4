export function createRecordKey(parts: Array<string | number | undefined | null>): string {
  return parts
    .map((part) => String(part ?? '').trim().toUpperCase().replace(/\s+/g, '_'))
    .join('|');
}
