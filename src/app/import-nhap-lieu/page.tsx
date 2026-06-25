import { PageHeader } from '@/components/layout/PageHeader';
import { BatchUploadMock } from '@/components/forms/BatchUploadMock';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export const dynamic = 'force-dynamic';

async function readImportHistory() {
  try {
    return await getDataStore().read(SHEET_NAMES.IMPORT_LICH_SU);
  } catch {
    return [];
  }
}

export default async function ImportNhapLieuPage() {
  const history = await readImportHistory();
  const historyRows = history.slice(-12).reverse().map((row) => [String(row['Ngày import'] ?? ''), String(row['Người import'] ?? ''), String(row['Trạng thái'] ?? ''), String(row['Ghi chú'] ?? ''), String(row['Tổng dòng mới'] ?? ''), String(row['Tổng dòng lỗi'] ?? '')]);

  return (
    <div className="space-y-2.5">
      <PageHeader title="Nhập liệu & Import" description="Upload nhiều file, preview lỗi/trùng/lệch, xác nhận trước khi ghi Google Sheet." status="Cần đối chiếu" />
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lịch sử import" value={`${history.length}`} status={history.length ? 'good' : 'neutral'} trend="Lần ghi nhận" compact />
        <MetricCard label="Quy tắc ghi" value="Confirm" status="good" trend="Preview trước" compact />
        <MetricCard label="Dòng lỗi" value="Chặn" status="warning" trend="Không ghi khi lỗi" compact />
        <MetricCard label="Nguồn lưu" value="Google Sheet" status="good" trend="Data Master" compact />
      </section>
      <section className="grid gap-2.5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardTitle>Batch upload nhiều file</CardTitle>
          <div className="mt-2"><BatchUploadMock /></div>
        </Card>
        <Card>
          <CardTitle>Quy tắc import production</CardTitle>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-black/65 md:text-sm">
            <li>Upload chỉ đọc, chưa ghi ngay.</li>
            <li>Preview trước khi xác nhận.</li>
            <li>Có lỗi/lệch thì không ghi.</li>
            <li>Google Sheet trống thì báo chưa đủ dữ liệu.</li>
          </ul>
        </Card>
      </section>
      <Card>
        <CardTitle>Lịch sử import gần nhất</CardTitle>
        <div className="mt-2"><ReportTable headers={['Ngày import', 'Người import', 'Trạng thái', 'Ghi chú', 'Dòng mới', 'Dòng lỗi']} rows={historyRows.length ? historyRows : [['—', '—', 'Chưa đủ dữ liệu', 'Chưa có lần import thật', '0', '0']]} maxHeight="max-h-[360px]" /></div>
      </Card>
    </div>
  );
}
