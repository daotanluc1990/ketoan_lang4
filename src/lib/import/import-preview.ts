import { getDataStore } from '@/lib/data-store';
import { buildExistingRowIndex, classifyImportRows } from '@/lib/dedupe/dedupe-engine';
import type { ImportPreviewResult, ImportRow } from './import-types';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';

export async function previewImport(input: {
  loaiDuLieu: string;
  chiNhanh: string;
  tenFile: string;
  dauVetFile: string;
  sheetDich: string;
  rows: ImportRow[];
  actor: string;
}): Promise<ImportPreviewResult> {
  const store = getDataStore();
  const existingRows = await store.read(input.sheetDich);
  const existingIndex = buildExistingRowIndex(existingRows);
  const classifiedRows = classifyImportRows(input.rows, existingIndex);
  const summary = {
    dongMoi: classifiedRows.filter((r) => r.status === 'Dòng mới').length,
    duLieuTrung: classifiedRows.filter((r) => r.status === 'Dữ liệu trùng').length,
    duLieuLech: classifiedRows.filter((r) => r.status === 'Dữ liệu lệch').length,
    dongLoi: classifiedRows.filter((r) => r.status === 'Dòng lỗi').length
  };
  const result = {
    maLanImport: `IMP-${Date.now()}`,
    loaiDuLieu: input.loaiDuLieu,
    chiNhanh: input.chiNhanh,
    tenFile: input.tenFile,
    dauVetFile: input.dauVetFile,
    rows: classifiedRows,
    summary
  };
  await writeAuditLog({ eventType: AUDIT_EVENTS.IMPORT_PREVIEW, actor: input.actor, target: input.tenFile, after: summary });
  return result;
}
