import { createFileHash } from '@/lib/import/file-hash';
import { previewImport } from '@/lib/import/import-preview';
import type { ImportPreviewResult } from '@/lib/import/import-types';
import { parseExcelFile } from './excel-parsers';
import type { ExcelFileInput } from './import-parser-types';

export type BatchImportPreview = {
  maBatch: string;
  files: Array<{
    tenFile: string;
    loaiDuLieu: string;
    chiNhanh: string;
    dauVetFile: string;
    warnings: string[];
    preview: ImportPreviewResult;
  }>;
  summary: {
    soFile: number;
    dongMoi: number;
    duLieuTrung: number;
    duLieuLech: number;
    dongLoi: number;
    soFileKhongNhanDien: number;
  };
};

export async function previewExcelBatch(files: ExcelFileInput[], actor: string): Promise<BatchImportPreview> {
  const maBatch = `BATCH-${Date.now()}`;
  const results = [];
  for (const file of files) {
    const parsed = parseExcelFile(file);
    const dauVetFile = createFileHash(file.buffer);
    const sheetDich = parsed.rows[0]?.sheetDich ?? 'KHONG_NHAN_DIEN';
    const preview = await previewImport({
      loaiDuLieu: parsed.loaiDuLieu,
      chiNhanh: parsed.chiNhanh,
      tenFile: parsed.tenFile,
      dauVetFile,
      sheetDich,
      rows: parsed.rows,
      actor
    });
    results.push({ tenFile: parsed.tenFile, loaiDuLieu: parsed.loaiDuLieu, chiNhanh: parsed.chiNhanh, dauVetFile, warnings: parsed.warnings, preview });
  }
  const summary = results.reduce((acc, file) => {
    acc.dongMoi += file.preview.summary.dongMoi;
    acc.duLieuTrung += file.preview.summary.duLieuTrung;
    acc.duLieuLech += file.preview.summary.duLieuLech;
    acc.dongLoi += file.preview.summary.dongLoi;
    acc.soFileKhongNhanDien += file.loaiDuLieu === 'Không nhận diện được' ? 1 : 0;
    return acc;
  }, { soFile: results.length, dongMoi: 0, duLieuTrung: 0, duLieuLech: 0, dongLoi: 0, soFileKhongNhanDien: 0 });
  return { maBatch, files: results, summary };
}
