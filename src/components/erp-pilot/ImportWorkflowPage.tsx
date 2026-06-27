import { BatchUploadMock } from '@/components/forms/BatchUploadMock';
import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

async function readImportHistory() {
  try { return await getDataStore().read(SHEET_NAMES.IMPORT_LICH_SU); } catch { return []; }
}

export async function ImportWorkflowPage() {
  const history = await readImportHistory();
  const historyRows = history.slice(-20).reverse().map((row) => [String(row['Ngày import'] ?? ''), String(row['Người import'] ?? ''), String(row['Trạng thái'] ?? ''), String(row['Ghi chú'] ?? ''), String(row['Tổng dòng mới'] ?? ''), String(row['Tổng dòng lỗi'] ?? '')]);
  const latest = historyRows[0];

  return (
    <div className="space-y-4">
      <ErpPageHeader eyebrow="Cơm Tấm Làng · ERP Mini" title="Nhập liệu & Import" description="Chọn file, xem trước, kiểm lỗi rồi xác nhận dữ liệu." status="Cần đối chiếu" meta={['Batch', 'Preview', 'History']} />
      <ErpSectionFrame tone="kpi" title="Trạng thái import">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ErpKpiCard label="Lịch sử import" value={`${history.length}`} status={history.length ? 'good' : 'neutral'} trend="IMPORT_LICH_SU" icon="LOG" />
          <ErpKpiCard label="Quy tắc xác nhận" value="Confirm" status="good" trend="Preview trước" icon="OK" />
          <ErpKpiCard label="Dòng lỗi" value="Cần rà" status="warning" trend="Kiểm file nguồn" icon="ERR" />
          <ErpKpiCard label="Nguồn dữ liệu" value="Google Sheet" status="good" trend="Data Master" icon="GS" />
        </section>
      </ErpSectionFrame>
      <ErpSectionFrame tone="summary" title="Quy tắc kiểm trước khi xác nhận" contentClassName="p-0">
        <ErpStatusStrip items={[
          { label: 'File', value: 'Nhiều file', tone: 'good', icon: 'FILE' },
          { label: 'Preview', value: 'Bắt buộc', tone: 'good', icon: 'VIEW' },
          { label: 'Dữ liệu lỗi', value: 'Cần rà', tone: 'warning', icon: 'ERR' },
          { label: 'Import gần nhất', value: latest?.[0] || 'Chưa có', tone: history.length ? 'good' : 'neutral', icon: 'LOG' },
          { label: 'Dòng mới', value: latest?.[4] || '0', tone: history.length ? 'good' : 'neutral', icon: 'NEW' },
          { label: 'Dòng lỗi', value: latest?.[5] || '0', tone: latest?.[5] && latest[5] !== '0' ? 'warning' : 'good', icon: 'ERR' }
        ]} />
      </ErpSectionFrame>
      <ErpSectionFrame tone="action" title="Batch upload nhiều file" description="Chọn file và kiểm tra batch trước khi xác nhận.">
        <BatchUploadMock />
      </ErpSectionFrame>
      <ErpSectionFrame tone="table" title="Quy tắc import và lịch sử" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <ErpInsightPanel title="Quy tắc import production" rows={[
            { label: 'Upload chỉ đọc', value: 'Preview', caption: 'Luôn xem trước', tone: 'good' },
            { label: 'Kiểm lỗi', value: 'Bắt buộc', caption: 'Rà trước khi xác nhận', tone: 'good' },
            { label: 'Dữ liệu lệch', value: 'Cần rà', caption: 'Đối chiếu file nguồn', tone: 'warning' },
            { label: 'Lịch sử import', value: 'Bắt buộc', caption: 'Ghi lại người import và kết quả', tone: 'good' },
            { label: 'Sheet trống', value: 'Chưa đủ dữ liệu', caption: 'Chưa kết luận số liệu', tone: 'warning' }
          ]} />
          <ErpDataTable title="Lịch sử import gần nhất" headers={['Ngày import', 'Người import', 'Trạng thái', 'Ghi chú', 'Dòng mới', 'Dòng lỗi']} rows={historyRows.length ? historyRows : [['—', '—', 'Chưa đủ dữ liệu', 'Chưa có lần import thật', '0', '0']]} maxHeight="max-h-[360px]" />
        </section>
      </ErpSectionFrame>
    </div>
  );
}
