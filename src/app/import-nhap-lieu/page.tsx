import { BatchUploadMock } from '@/components/forms/BatchUploadMock';
import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export const revalidate = 300;

async function readImportHistory() {
  try { return await getDataStore().read(SHEET_NAMES.IMPORT_LICH_SU); } catch { return []; }
}

export default async function ImportNhapLieuPage() {
  const history = await readImportHistory();
  const historyRows = history.slice(-20).reverse().map((row) => [String(row['Ngày import'] ?? ''), String(row['Người import'] ?? ''), String(row['Trạng thái'] ?? ''), String(row['Ghi chú'] ?? ''), String(row['Tổng dòng mới'] ?? ''), String(row['Tổng dòng lỗi'] ?? '')]);
  const latest = historyRows[0];

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="Nhập liệu & Import"
        description="Upload nhiều file, preview/dry-run, kiểm lỗi rồi mới ghi dữ liệu. Không ghi Google Sheet nếu chưa xác nhận."
        status="Cần đối chiếu"
        meta={['Batch upload', 'Dry-run trước khi ghi', 'Có lịch sử import']}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ErpKpiCard label="Lịch sử import" value={`${history.length}`} status={history.length ? 'good' : 'neutral'} trend="IMPORT_LICH_SU" icon="LOG" />
        <ErpKpiCard label="Quy tắc ghi" value="Confirm" status="good" trend="Preview trước" icon="OK" />
        <ErpKpiCard label="Dòng lỗi" value="Chặn" status="warning" trend="Lỗi/lệch không import" icon="!" />
        <ErpKpiCard label="Nguồn dữ liệu" value="Google Sheet" status="good" trend="Data Master" icon="GS" />
      </section>

      <ErpStatusStrip
        items={[
          { label: 'File upload', value: 'Nhiều file', tone: 'good', icon: 'FILE' },
          { label: 'Preview', value: 'Bắt buộc', tone: 'good', icon: 'DRY' },
          { label: 'Lỗi dữ liệu', value: 'Chặn ghi', tone: 'warning', icon: 'STOP' },
          { label: 'Import gần nhất', value: latest?.[0] || 'Chưa có', tone: history.length ? 'good' : 'neutral', icon: 'LOG' },
          { label: 'Dòng mới gần nhất', value: latest?.[4] || '0', tone: history.length ? 'good' : 'neutral', icon: '+' },
          { label: 'Dòng lỗi gần nhất', value: latest?.[5] || '0', tone: latest?.[5] && latest[5] !== '0' ? 'warning' : 'good', icon: 'ERR' }
        ]}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="text-base font-black tracking-[-0.02em] text-slate-950">Batch upload nhiều file</h3>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">Chọn file, kiểm tra batch, chỉ import file đạt khi lỗi = 0 và lệch = 0.</p>
        </div>
        <BatchUploadMock />
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ErpInsightPanel
          title="Quy tắc import production"
          rows={[
            { label: 'Upload chỉ đọc', value: 'Không ghi ngay', caption: 'Luôn preview trước', tone: 'good' },
            { label: 'Dry-run bắt buộc', value: 'Có', caption: 'Kiểm lỗi trước khi xác nhận', tone: 'good' },
            { label: 'Dữ liệu lệch/lỗi', value: 'Chặn', caption: 'Không ghi vào Google Sheet', tone: 'warning' },
            { label: 'Lịch sử import', value: 'Bắt buộc', caption: 'Ghi lại người import, dòng mới, dòng lỗi', tone: 'good' },
            { label: 'Sheet trống', value: 'Chưa đủ dữ liệu', caption: 'Không được kết luận số liệu', tone: 'warning' }
          ]}
        />
        <ErpDataTable
          title="Lịch sử import gần nhất"
          headers={['Ngày import', 'Người import', 'Trạng thái', 'Ghi chú', 'Dòng mới', 'Dòng lỗi']}
          rows={historyRows.length ? historyRows : [['—', '—', 'Chưa đủ dữ liệu', 'Chưa có lần import thật', '0', '0']]}
          maxHeight="max-h-[360px]"
        />
      </section>
    </div>
  );
}
