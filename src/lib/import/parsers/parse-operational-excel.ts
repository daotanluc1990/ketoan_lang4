import type { ExcelFileInput, ParsedExcelImport } from './import-parser-types';
import { readWorkbook, rowsAsMatrix } from './excel-utils';
import { looksLikeOperationalCashbook, parseOperationalCashbookFile } from './cashbook-operational-parser';
import { looksLikeCentralKitchenInventory, looksLikeCentralKitchenIssue, looksLikeDebtReport, parseCentralKitchenInventoryFile, parseCentralKitchenIssueFile, parseDebtFile } from './operational-parsers';

export function parseOperationalExcelFile(input: ExcelFileInput): ParsedExcelImport | null {
  const { firstSheet } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);

  if (looksLikeOperationalCashbook(input.filename, matrix)) return parseOperationalCashbookFile(input);
  if (looksLikeCentralKitchenIssue(input.filename, matrix)) return parseCentralKitchenIssueFile(input);
  if (looksLikeCentralKitchenInventory(input.filename, matrix)) return parseCentralKitchenInventoryFile(input);
  if (looksLikeDebtReport(input.filename, matrix)) return parseDebtFile(input);

  return null;
}
