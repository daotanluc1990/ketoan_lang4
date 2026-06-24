import { GOOGLE_SHEETS_SCHEMA } from '../src/lib/google-sheets/schema';

const duplicateSheetNames = GOOGLE_SHEETS_SCHEMA
  .map((s) => s.sheetName)
  .filter((name, idx, arr) => arr.indexOf(name) !== idx);

if (duplicateSheetNames.length) {
  console.error('Trùng tên sheet:', duplicateSheetNames);
  process.exit(1);
}

const badSheets = GOOGLE_SHEETS_SCHEMA.filter((s) => !s.columns.length || s.sheetName.length > 31);
if (badSheets.length) {
  console.error('Sheet lỗi:', badSheets.map((s) => s.sheetName));
  process.exit(1);
}

console.log(`OK: ${GOOGLE_SHEETS_SCHEMA.length} sheet tiếng Việt đã được định nghĩa.`);
