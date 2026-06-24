export function requireFields(row: Record<string, unknown>, requiredFields: string[]) {
  const errors: string[] = [];
  for (const field of requiredFields) {
    const value = row[field];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`Thiếu cột bắt buộc: ${field}`);
    }
  }
  return errors;
}

export function isInvalidExcelEmptyDate(value: unknown) {
  return String(value).includes('30/12/1899') || String(value).includes('1899-12-30');
}
