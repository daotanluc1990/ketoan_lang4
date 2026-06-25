import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

export default async function PlTuanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const status = report.hasRealData ? (report.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu';
  const pnlKpis = report.executiveKpis.filter((kpi) => ['Tổng doanh thu', 'Doanh thu cửa hàng', 'Doanh thu app net', 'Tiền ra', 'Chi cần phân loại', 'Thất thoát quy tiền'].includes(kpi.label));

  return (
    <div className="space-y-3">
      <PageHeader title="P&L Tuần" description="Xem doanh thu, giá vốn, chi phí cửa hàng, chi Bếp Trung Tâm theo dõi riêng và lợi nhuận tạm." status={status} />
      {!report.hasRealData ? <EmptyState title="Chưa đủ dữ liệu để kết luận" description="Hãy import dữ liệu thật trước khi chốt P&L." /> : null}

      <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {pnlKpis.map((kpi) => <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} trend={kpi.trend} status={kpi.status} compact />)}
      </section>

      <section className="grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle>Bảng P&L chính</CardTitle>
          <div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Tuần này', 'Tuần trước', 'Chênh lệch', 'Tỷ lệ', 'Đánh giá']} rows={report.pnlRows} maxHeight="max-h-[520px]" /></div>
        </Card>
        <Card>
          <CardTitle>Ghi chú chốt P&L</CardTitle>
          <div className="mt-2 space-y-2 text-sm text-black/70">
            <p>{report.hasRealData ? 'Đang đọc dữ liệu đã import.' : 'Chưa đủ dữ liệu để kết luận.'}</p>
            <p>Chi Bếp Trung Tâm nếu có sẽ theo dõi riêng, không trộn vào chi phí cửa hàng.</p>
            {report.missingSources.length ? <p>Còn thiếu: {report.missingSources.join(', ')}.</p> : <p>Không thiếu nguồn chính.</p>}
          </div>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Doanh thu theo nguồn" items={report.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue }))} />
        <ChartCard title="Tỷ lệ chính" items={[{ label: 'COGS tạm tính', value: report.totals.cogsPercent * 100, caption: `${(report.totals.cogsPercent * 100).toFixed(1)}%` }, { label: 'App fee%', value: report.totals.appFeePercent * 100, caption: `${(report.totals.appFeePercent * 100).toFixed(1)}%` }]} />
      </section>

      <Card>
        <CardTitle>Top 5 thất thoát đưa vào P&L</CardTitle>
        <div className="mt-2"><ReportTable headers={['NVL', 'ĐVT', 'Chênh SL', 'Giá trị lệch', 'Tỷ lệ', 'Trạng thái', 'Hành động']} rows={report.lossTop5Rows.map((row) => [row[0], row[1], row[2], row[3], row[4], row[7], row[8]])} maxHeight="max-h-[260px]" /></div>
      </Card>
    </div>
  );
}
