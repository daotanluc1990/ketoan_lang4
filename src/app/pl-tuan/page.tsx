import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { buildSnapshotPnlReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

const pnlTrend: Record<string, { hint: string; icon: string }> = {
  'Tổng doanh thu': { hint: 'Nguồn hiện có', icon: 'DT' },
  'Doanh thu cửa hàng': { hint: 'Offline + MoMo', icon: 'CH' },
  'Doanh thu app net': { hint: 'Kênh app', icon: 'APP' },
  'Tiền ra': { hint: 'Theo sổ quỹ', icon: 'OUT' },
  'Chi cần phân loại': { hint: 'Kế toán rà', icon: 'CHI' },
  'Thất thoát quy tiền': { hint: 'Theo NVL', icon: 'TT' }
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
      <ErpPageHeader eyebrow="Cơm Tấm Làng · ERP Mini" title="P&L Tuần" description="Doanh thu, giá vốn, chi phí và lợi nhuận tạm." status={status} meta={['Theo bộ lọc', 'Dữ liệu hiện có', 'Số tạm']} />

      {!report.hasRealData ? <ErpSectionFrame tone="risk" title="Thiếu dữ liệu P&L"><p className="text-[12px] font-bold text-amber-900">Cần bổ sung doanh thu, tồn kho, thất thoát và các khoản chi trước khi chốt.</p></ErpSectionFrame> : null}

      <ErpSectionFrame tone="kpi" title="Chỉ số tài chính chính">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {pnlKpis.map((kpi) => <ErpKpiCard key={kpi.label} label={kpi.label} value={kpi.value} trend={pnlTrend[kpi.label]?.hint} status={kpi.status ?? 'neutral'} icon={pnlTrend[kpi.label]?.icon} />)}
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Cảnh báo trước khi chốt" contentClassName="p-0">
        <ErpStatusStrip items={[
          { label: 'P&L tạm', value: report.hasRealData ? 'Có dữ liệu' : 'Chờ dữ liệu', tone: report.hasRealData ? 'warning' : 'neutral', icon: 'P&L' },
          { label: 'Chi cần phân loại', value: unclassified, tone: unclassified === '0đ' ? 'good' : 'warning', icon: 'CHI' },
          { label: 'Thất thoát', value: lossKpi, tone: lossKpi === '0đ' ? 'good' : 'warning', icon: 'TT' },
          { label: 'Bằng chứng', value: evidenceCount, tone: evidenceCount ? 'good' : 'neutral', icon: 'DOC' },
          { label: 'Giới hạn', value: limitationCount, tone: limitationCount ? 'warning' : 'good', icon: 'LIM' },
          { label: 'Trạng thái', value: status, tone: report.hasRealData ? 'warning' : 'neutral', icon: 'CHK' }
        ]} />
      </ErpSectionFrame>

      <ErpSectionFrame tone="table" title="Bảng P&L và tín hiệu chốt" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ErpDataTable title="Bảng P&L chính" headers={['Nhóm', 'Chỉ số', 'Tuần này', 'Tuần trước', 'Chênh lệch', 'Tỷ lệ', 'Đánh giá']} rows={report.pnlRows} maxHeight="max-h-[520px]" />
          <div className="space-y-4">
            <ErpInsightPanel title="Tín hiệu chốt P&L" rows={[
              { label: 'COGS tạm tính', value: `${(report.totals.cogsPercent * 100).toFixed(1)}%`, caption: 'Theo giá vốn tạm tính', tone: report.totals.cogsPercent ? 'warning' : 'neutral' },
              { label: 'Thất thoát', value: lossKpi, caption: 'Theo báo cáo NVL', tone: lossKpi === '0đ' ? 'good' : 'warning' },
              { label: 'Chi cần phân loại', value: unclassified, caption: 'Kế toán rà trước khi chốt', tone: unclassified === '0đ' ? 'good' : 'warning' },
              { label: 'Chi Bếp Trung Tâm', value: 'Theo dõi riêng', caption: 'Theo dõi riêng', tone: 'warning' }
            ]} />
            <ErpInsightPanel title="Bằng chứng & giới hạn" rows={[...report.financeEvidenceRows, ...report.financeLimitationRows].slice(0, 8).map((row) => ({ label: row[0], value: row[2], caption: row[3], tone: row[0].includes('Thiếu') ? 'warning' : 'neutral' }))} />
          </div>
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="neutral" title="Nguồn doanh thu và phân loại chi" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-2">
          <ErpDataTable title="Chi theo đơn vị chịu chi" headers={['Đơn vị', 'Bản chất', 'Số tiền', 'Xử lý', 'Tỷ trọng', 'Trạng thái', 'Hành động']} rows={report.cashbookGroupRows} maxHeight="max-h-[360px]" />
          <ErpDataTable title="Doanh thu theo nguồn" headers={['Kênh', 'Doanh thu']} rows={report.revenueByChannel.map((item) => [item.channel, item.revenue])} maxHeight="max-h-[360px]" />
        </section>
      </ErpSectionFrame>
    </div>
  );
}
