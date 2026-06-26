import { getDataStore } from '@/lib/data-store';

type ArchiveRow = Record<string, unknown>;

const ARCHIVE_SHEET = 'REPORT_SNAPSHOT_HISTORY';

export async function saveReportArchive(name: string, data: unknown) {
  try {
    const row: ArchiveRow = {
      'Thời gian': new Date().toISOString(),
      'Tên báo cáo': name,
      'Nội dung JSON': JSON.stringify(data)
    };
    await getDataStore().append(ARCHIVE_SHEET, [row]);
    return true;
  } catch {
    return false;
  }
}
