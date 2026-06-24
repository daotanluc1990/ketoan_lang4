import type { ImportRow } from '@/lib/import/import-types';

export type ParsedExcelImport = {
  tenFile: string;
  loaiDuLieu: string;
  chiNhanh: string;
  rows: ImportRow[];
  warnings: string[];
};

export type ExcelFileInput = {
  filename: string;
  buffer: Buffer;
};
