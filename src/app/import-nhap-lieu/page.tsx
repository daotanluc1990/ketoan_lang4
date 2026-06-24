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
    <div className="space-y-4">
      <PageHeader title="Nhập liệu & Import" description="Luồng import an toàn: chọn kỳ, upload nhiều file, dry-run preview, kiểm lỗi/trùng/lệch, xác nhận trước khi ghi Google Sheet." status="Cần đối chiếu" />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lịch sử import" value={`${history.length}`} status={history.length ? 'good' : 'neutral'} trend="Dòng IMPORT_LICH_SU" />
        <MetricCard label="Quy tắc ghi" value="Confirm" status="good" trend="Preview không ghi" />
        <MetricCard label="Dòng lỗi" value="Chặn" status="warning" trend="Có lỗi/lệch thì không import" />
        <MetricCard label="Nguồn dữ liệu" value="Google Sheet" status="good" trend="Nếu DATA_STORE=google_sheets" />
      </section>
      <Card>
        <CardTitle>Batch upload nhiều file</CardTitle>
        <p className="mt-2 text-sm text-black/60">Kế toán có thể nhập cùng lúc doanh thu app, doanh thu cửa hàng, sổ quỹ, tồn kho và thất thoát. Nút Kiểm tra batch chỉ preview; nút Import file đạt mới ghi Google Sheet.</p>
        <div className="mt-3"><BatchUploadMock /></div>
      </Card>
      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Quy tắc import production</CardTitle>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black/70">
            <li>Upload chỉ đọc, không ghi ngay.</li>
            <li>Dry-run preview trước khi xác nhận.</li>
            <li>File lỗi hoặc dữ liệu lệch không được ghi.</li>
            <li>Mọi lần import phải ghi IMPORT_LICH_SU và AUDIT_LOG.</li>
            <li>Google Sheet trống thì báo Chưa đủ dữ liệu để kết luận, không dùng số mẫu.</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Lịch sử import gần nhất</CardTitle>
          <div className="mt-3"><ReportTable headers={['Ngày import', 'Người import', 'Trạng thái', 'Ghi chú', 'Dòng mới', 'Dòng lỗi']} rows={historyRows.length ? historyRows : [['—', '—', 'Chưa đủ dữ liệu', 'Chưa có lần import thật', '0', '0']]} /></div>
        </Card>
      </section>
    </div>
  );
}
