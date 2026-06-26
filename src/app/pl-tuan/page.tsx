import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildFastPnlReport } from '@/lib/reports/fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 60;

const pnlTrend: Record<string, string> = {
  'Tổng doanh thu': 'Nguồn hiện có',
  'Doanh thu cửa hàng': 'Offline + MoMo',
  'Doanh thu app net': 'Kênh app',
  'Tiền ra': 'Theo sổ quỹ',
  'Chi cần phân loại': 'Kế toán rà',
  'Thất thoát quy tiền': 'Theo NVL'
};

export default async function PlTuanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildFastPnlReport(await resolvePageSearchParams(searchParams));
  const status = report.hasRealData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu';
  const pnlKpis = report.executiveKpis.filter((kpi) => Object.keys(pnlTrend).includes(kpi.label));
  const lossKpi = report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—';

  return (
    <div className="space-y-2.5">
      <PageHeader title="P&L Tuần" description="Doanh thu, giá vốn, chi phí và lợi nhuận tạm." status={status} />
      {!report.hasRealData ? <EmptyState title="Chưa đủ dữ liệu để kết luận" description="Import dữ liệu thật trước khi chốt P&L." /> : null}
      <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {pnlKpis.map((kpi) => <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} trend={pnlTrend[kpi.label]} status={kpi.status} compact />)}
      </section>
      <section className="grid gap-2 xl:grid-cols-[minmax(0,2.2fr)_minmax(260px,0.8fr)]">
        <Card><CardTitle>Bảng P&L chính</CardTitle><div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Tuần này', 'Tuần trước', 'Chênh lệch', 'Tỷ lệ', 'Đánh giá']} rows={report.pnlRows} maxHeight="max-h-[420px]" /></div></Card>
        <Card><CardTitle>Tín hiệu chốt P&L</CardTitle><div className="mt-2"><ReportTable headers={['Chỉ số', 'Giá trị', 'Đọc nhanh']} rows={[[ 'COGS tạm tính', `${(report.totals.cogsPercent * 100).toFixed(1)}%`, 'Theo giá vốn tạm tính' ], [ 'Thất thoát', lossKpi, 'Theo báo cáo NVL' ], [ 'Chi cần phân loại', report.executiveKpis.find((kpi) => kpi.label === 'Chi cần phân loại')?.value ?? '—', 'Kế toán rà trước khi chốt' ], [ 'Chi Bếp Trung Tâm', 'Theo dõi riêng', 'Tách khỏi chi phí cửa hàng' ]]} maxHeight="max-h-[220px]" /></div></Card>
      </section>
      <section className="grid gap-2 xl:grid-cols-2">
        <Card><CardTitle>Chi theo đơn vị chịu chi</CardTitle><div className="mt-2"><ReportTable headers={['Đơn vị', 'Bản chất', 'Số tiền', 'Xử lý', 'Tỷ trọng', 'Trạng thái', 'Hành động']} rows={report.cashbookGroupRows} maxHeight="max-h-[300px]" /></div></Card>
        <Card><CardTitle>Bằng chứng và giới hạn</CardTitle><div className="mt-2"><ReportTable headers={['Nguồn', 'Chỉ số', 'Giá trị', 'Ghi chú']} rows={[...report.financeEvidenceRows, ...report.financeLimitationRows].slice(0, 10)} maxHeight="max-h-[300px]" /></div></Card>
      </section>
      <ChartCard title="Doanh thu theo nguồn" items={report.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue }))} />
    </div>
  );
}
