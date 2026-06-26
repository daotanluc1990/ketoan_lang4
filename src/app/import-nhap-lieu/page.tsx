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
  const historyRows = history.slice(-20).reverse().map((row) => [
    String(row['Ngày import'] ?? ''),
    String(row['Người import'] ?? ''),
    String(row['Trạng thái'] ?? ''),
    String(row['Ghi chú'] ?? ''),
    String(row['Tổng dòng mới'] ?? ''),
    String(row['Tổng dòng lỗi'] ?? '')
  ]);

  return (
    <div className="space-y-2.5">
      <PageHeader title="Nhập liệu & Import" description="Upload, preview, kiểm lỗi và ghi dữ liệu." status="Cần đối chiếu" />
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact label="Lịch sử import" value={`${history.length}`} status={history.length ? 'good' : 'neutral'} trend="IMPORT_LICH_SU" />
        <MetricCard compact label="Quy tắc ghi" value="Confirm" status="good" trend="Preview trước" />
        <MetricCard compact label="Dòng lỗi" value="Chặn" status="warning" trend="Lỗi/lệch không import" />
        <MetricCard compact label="Nguồn dữ liệu" value="Google Sheet" status="good" trend="Data Master" />
      </section>

      <Card>
        <CardTitle>Batch upload nhiều file</CardTitle>
        <div className="mt-2"><BatchUploadMock /></div>
      </Card>

      <section className="grid gap-2 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardTitle>Quy tắc import production</CardTitle>
          <ul className="mt-2 grid gap-1.5 text-xs font-semibold text-slate-700">
            <li>• Upload chỉ đọc, không ghi ngay.</li>
            <li>• Dry-run preview trước khi xác nhận.</li>
            <li>• File lỗi hoặc dữ liệu lệch không được ghi.</li>
            <li>• Mọi lần import phải ghi lịch sử và audit.</li>
            <li>• Sheet trống thì báo chưa đủ dữ liệu.</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Lịch sử import gần nhất</CardTitle>
          <div className="mt-2"><ReportTable headers={['Ngày import', 'Người import', 'Trạng thái', 'Ghi chú', 'Dòng mới', 'Dòng lỗi']} rows={historyRows.length ? historyRows : [['—', '—', 'Chưa đủ dữ liệu', 'Chưa có lần import thật', '0', '0']]} maxHeight="max-h-[360px]" /></div>
        </Card>
      </section>
    </div>
  );
}
