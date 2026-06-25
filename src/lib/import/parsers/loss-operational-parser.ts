import { createRowHash } from '@/lib/import/row-hash';
import type { ExcelFileInput, ParsedExcelImport } from './import-parser-types';
import { cleanHeader, readWorkbook, rowsAsMatrix, toNumber } from './excel-utils';
import { parseLossReportFile } from './excel-parsers';

export function looksLikeOperationalLossReport(filename: string, workbookSheetNames: string[], matrix: unknown[][]) {
  const rowText = matrix.slice(0, 8).flat().map(cleanHeader).join('|').toLowerCase();
  return filename.toLowerCase().includes('thất thoát') || workbookSheetNames.some((name) => name.toLowerCase().includes('thất thoát')) || rowText.includes('kiểm soát thất thoát');
}

export function parseOperationalLossReportFile(input: ExcelFileInput): ParsedExcelImport {
  const parsed = parseLossReportFile(input);
  return {
    ...parsed,
    rows: parsed.rows.map((row) => {
      const chenh = toNumber(row.data['Chênh lệch số lượng']);
      const ratio = Math.abs(toNumber(row.data['Tỷ lệ thất thoát']));
      const data = {
        ...row.data,
        'Loại chênh lệch': chenh < 0 ? 'Thiếu/thất thoát' : chenh > 0 ? 'Dư/cần kiểm tra' : 'Khớp',
        'Tỷ lệ thất thoát': ratio,
        'Trạng thái': ratio > 0.05 ? 'Cảnh báo' : 'Tốt'
      };
      return { ...row, data, dauVetDong: createRowHash(data) };
    })
  };
}

export function canParseOperationalLossReport(input: ExcelFileInput) {
  const { workbook, firstSheet } = readWorkbook(input.buffer);
  return looksLikeOperationalLossReport(input.filename, workbook.SheetNames, rowsAsMatrix(firstSheet));
}
