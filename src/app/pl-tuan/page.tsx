import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

const pnlTrend: Record<string, string> = {
  'Tổng doanh thu': 'Nguồn hiện có',
  'Doanh thu cửa hàng': 'Offline + MoMo',
  'Doanh thu app net': 'Sau phí app',
  'Tiền ra': 'Theo sổ quỹ',
  'Chi cần phân loại': 'Kế toán rà',
  'Thất thoát quy tiền': 'Theo NVL'
};

export default async function PlTuanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const status = report.hasRealData ? (report.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu';
  const pnlKpis = report.executiveKpis.filter((kpi) => Object.keys(pnlTrend).includes(kpi.label));

  return (
    <div className="space-y-2.5">
      <PageHeader title="P&L Tuần" description="Doanh thu, giá vốn, chi phí cửa hàng, chi Bếp Trung Tâm riêng và lợi nhuận tạm." status={status} />
      {!report.hasRealData ? <EmptyState title="Chưa đủ dữ liệu để kết luận" description="Hãy import dữ liệu thật trước khi chốt P&L." /> : null}

      <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {pnlKpis.map((kpi) => <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} trend={pnlTrend[kpi.label]} status={kpi.status} compact />)}
      </section>

      <section className="grid gap-2.5 xl:grid-cols-[minmax(0,2.2fr)_minmax(260px,0.8fr)]">
        <Card>
          <CardTitle>Bảng P&L chính</CardTitle>
          <div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Tuần này', 'Tuần trước', 'Chênh lệch', 'Tỷ lệ', 'Đánh giá']} rows={report.pnlRows} maxHeight="max-h-[440px]" /></div>
        </Card>
        <Card>
          <CardTitle>Ghi chú chốt P&L</CardTitle>
          <div className="mt-2 space-y-1.5 text-xs leading-5 text-black/65 md:text-sm">
            <p>{report.hasRealData ? 'Đã đọc dữ liệu import.' : 'Chưa đủ dữ liệu.'}</p>
            <p>Chi Bếp Trung Tâm theo dõi riêng, không trộn vào chi phí cửa hàng.</p>
            <p>{report.missingSources.length ? `Thiếu: ${report.missingSources.join(', ')}.` : 'Không thiếu nguồn chính.'}</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-2.5 xl:grid-cols-2">
        <ChartCard title="Doanh thu theo nguồn" items={report.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue }))} />
        <ChartCard title="Tỷ lệ chính" items={[{ label: 'COGS tạm tính', value: report.totals.cogsPercent * 100, caption: `${(report.totals.cogsPercent * 100).toFixed(1)}%` }, { label: 'App fee%', value: report.totals.appFeePercent * 100, caption: `${(report.totals.appFeePercent * 100).toFixed(1)}%` }]} />
      </section>
    </div>
  );
}
