import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { ImportPreviewResult } from './import-types';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';

export async function confirmImport(preview: ImportPreviewResult, actor: string) {
  const hasBlockingRows = preview.summary.dongLoi > 0 || preview.summary.duLieuLech > 0;
  if (hasBlockingRows) {
    return {
      ok: false,
      writtenRows: 0,
      message: 'Có dòng lỗi hoặc dữ liệu lệch. Không ghi Google Sheet. Cần xử lý/đối chiếu trước.'
    };
  }

  const store = getDataStore();
  const rowsToWrite = preview.rows.filter((row) => row.status === 'Dòng mới');
  const rowsBySheet = new Map<string, Record<string, unknown>[]>();

  for (const row of rowsToWrite) {
    const list = rowsBySheet.get(row.sheetDich) ?? [];
    list.push({
      ...row.data,
      'Mã dòng dữ liệu': row.maDongDuLieu,
      'Dấu vết dòng': row.dauVetDong,
      'Mã lần import': preview.maLanImport,
      'Trạng thái dữ liệu': 'Đã xác nhận',
      'Ngày import': new Date().toISOString(),
      'Người import': actor
    });
    rowsBySheet.set(row.sheetDich, list);
  }

  for (const [sheetName, rows] of rowsBySheet.entries()) {
    await store.append(sheetName, rows);
  }

  await store.append(SHEET_NAMES.IMPORT_LICH_SU, [
    {
      'Mã lần import': preview.maLanImport,
      'Ngày import': new Date().toISOString(),
      'Người import': actor,
      'Chi nhánh': preview.chiNhanh,
      'Tuần': 'Tự nhận diện',
      'Số file': 1,
      'Tổng dòng mới': preview.summary.dongMoi,
      'Tổng dòng trùng': preview.summary.duLieuTrung,
      'Tổng dòng lệch': preview.summary.duLieuLech,
      'Tổng dòng lỗi': preview.summary.dongLoi,
      'Trạng thái': 'Đã xác nhận',
      'Ghi chú': `${preview.loaiDuLieu} — ${preview.tenFile}`
    }
  ]);

  await writeAuditLog({ eventType: AUDIT_EVENTS.IMPORT_CONFIRM, actor, target: preview.maLanImport, after: preview.summary });
  return { ok: true, writtenRows: rowsToWrite.length, message: rowsToWrite.length ? 'Đã ghi dữ liệu mới vào Google Sheet.' : 'Không có dòng mới để ghi.' };
}
