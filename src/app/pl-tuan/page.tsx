import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { buildSnapshotPnlReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

const pnlTrend: Record<string, { hint: string; icon: string }> = {
  'Tổng doanh thu': { hint: 'Nguồn hiện có', icon: '₫' },
  'Doanh thu cửa hàng': { hint: 'Offline + MoMo', icon: '🏪' },
  'Doanh thu app net': { hint: 'Kênh app', icon: '📱' },
  'Tiền ra': { hint: 'Theo sổ quỹ', icon: '↑' },
  'Chi cần phân loại': { hint: 'Kế toán rà', icon: '!' },
  'Thất thoát quy tiền': { hint: 'Theo NVL', icon: '⚠' }
};

export default async function PlTuanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotPnlReport(await resolvePageSearchParams(searchParams));
  const status = report.hasRealData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu';
  const pnlKpis = report.executiveKpis.filter((kpi) => Object.keys(pnlTrend).includes(kpi.label));
  const lossKpi = report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—';
  const unclassified = report.executiveKpis.find((kpi) => kpi.label === 'Chi cần phân loại')?.value ?? '—';
  const evidenceCount = report.financeEvidenceRows.length;
  const limitationCount = report.financeLimitationRows.length;

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="P&L Tuần"
        description="Doanh thu, giá vốn, chi phí và lợi nhuận tạm. Số tạm không được xem là báo cáo đã chốt."
        status={status}
        meta={['Tuần/Kỳ theo bộ lọc', 'Theo dữ liệu hiện có', 'Chưa thay đổi công thức kế toán']}
      />

      {!report.hasRealData ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-900">
          Chưa đủ dữ liệu để kết luận P&L. Cần import doanh thu, tồn kho/thất thoát và đối chiếu các khoản chi trước khi chốt.
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {pnlKpis.map((kpi) => (
          <ErpKpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={pnlTrend[kpi.label]?.hint}
            status={kpi.status ?? 'neutral'}
            icon={pnlTrend[kpi.label]?.icon}
          />
        ))}
      </section>

      <ErpStatusStrip
        items={[
          { label: 'P&L tạm', value: report.hasRealData ? 'Có dữ liệu' : 'Chờ dữ liệu', tone: report.hasRealData ? 'warning' : 'neutral', icon: 'P&L' },
          { label: 'Chi cần phân loại', value: unclassified, tone: unclassified === '0đ' ? 'good' : 'warning', icon: 'CHI' },
          { label: 'Thất thoát', value: lossKpi, tone: lossKpi === '0đ' ? 'good' : 'warning', icon: 'TT' },
          { label: 'Bằng chứng', value: evidenceCount, tone: evidenceCount ? 'good' : 'neutral', icon: 'DOC' },
          { label: 'Giới hạn', value: limitationCount, tone: limitationCount ? 'warning' : 'good', icon: 'LIM' },
          { label: 'Trạng thái', value: status, tone: status === 'Tốt' ? 'good' : 'warning', icon: 'CHK' }
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ErpDataTable
          title="Bảng P&L chính"
          headers={['Nhóm', 'Chỉ số', 'Tuần này', 'Tuần trước', 'Chênh lệch', 'Tỷ lệ', 'Đánh giá']}
          rows={report.pnlRows}
          maxHeight="max-h-[520px]"
        />
        <div className="space-y-4">
          <ErpInsightPanel
            title="Tín hiệu chốt P&L"
            rows={[
              { label: 'COGS tạm tính', value: `${(report.totals.cogsPercent * 100).toFixed(1)}%`, caption: 'Theo giá vốn tạm tính', tone: report.totals.cogsPercent ? 'warning' : 'neutral' },
              { label: 'Thất thoát', value: lossKpi, caption: 'Theo báo cáo NVL', tone: lossKpi === '0đ' ? 'good' : 'warning' },
              { label: 'Chi cần phân loại', value: unclassified, caption: 'Kế toán rà trước khi chốt', tone: unclassified === '0đ' ? 'good' : 'warning' },
              { label: 'Chi Bếp Trung Tâm', value: 'Theo dõi riêng', caption: 'Không đưa thẳng vào chi phí cửa hàng', tone: 'warning' }
            ]}
          />
          <ErpInsightPanel
            title="Bằng chứng & giới hạn"
            rows={[...report.financeEvidenceRows, ...report.financeLimitationRows].slice(0, 8).map((row) => ({ label: row[0], value: row[2], caption: row[3], tone: row[0].includes('Thiếu') ? 'warning' : 'neutral' }))}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ErpDataTable
          title="Chi theo đơn vị chịu chi"
          headers={['Đơn vị', 'Bản chất', 'Số tiền', 'Xử lý', 'Tỷ trọng', 'Trạng thái', 'Hành động']}
          rows={report.cashbookGroupRows}
          maxHeight="max-h-[360px]"
        />
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black tracking-[-0.02em] text-slate-950">Doanh thu theo nguồn</h3>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">Dùng để đọc nhanh nguyên nhân P&L chưa đủ nguồn.</p>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase text-slate-500">BAR</span>
          </div>
          <div className="mt-4 space-y-4">
            {report.revenueByChannel.map((item, index) => {
              const max = Math.max(...report.revenueByChannel.map((channel) => channel.value), 1);
              return (
                <div key={item.channel}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px] font-black text-slate-700">
                    <span>{item.channel}</span>
                    <span className="number text-slate-500">{item.revenue}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={index === 0 ? 'h-full rounded-full bg-red-700' : 'h-full rounded-full bg-slate-300'} style={{ width: `${Math.max(6, Math.round((item.value / max) * 100))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
