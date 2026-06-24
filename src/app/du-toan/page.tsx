import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

export default async function DuToanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const canForecast = report.hasRealData && report.sourceCounts.cashbook > 0 && (report.sourceCounts.appRevenue > 0 || report.sourceCounts.storeRevenue > 0);
  const revenueNext = report.totals.revenue * 1.04;
  const cashOutNext = report.totals.cashOut || 0;
  const endingNext = report.totals.cashEnding + revenueNext - cashOutNext;
  const revenueRows = canForecast
    ? [[ 'Tổng doanh thu', report.executiveKpis[0]?.value ?? '—', `${(revenueNext / 1_000_000).toFixed(1).replace('.', ',')}tr`, '+4,0%', 'Dự toán tạm từ tuần hiện tại' ]]
    : [[ 'Tổng doanh thu', 'Chưa đủ dữ liệu', '—', '—', 'Cần import doanh thu thật trước' ]];
  const costRows = canForecast
    ? [[ 'Chi theo sổ quỹ', `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr`, `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr`, cashOutNext ? 'Cần xem xét' : 'Không', 'Dựa trên tiền ra tuần hiện tại' ]]
    : [[ 'Chi theo sổ quỹ', 'Chưa đủ dữ liệu', '—', 'Không', 'Cần import sổ quỹ thật trước' ]];

  return (
    <div className="space-y-4">
      <PageHeader title="Dự toán tuần tới" description="Dự toán chỉ chạy khi đã có dữ liệu thật. Nếu thiếu dữ liệu, hệ thống không tự bịa số." status={canForecast ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      {!canForecast ? <EmptyState title="Chưa đủ dữ liệu để dự toán" description="Cần ít nhất doanh thu thật và sổ quỹ thật. Hệ thống không dùng dữ liệu mẫu để dự toán." /> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Dự toán doanh thu" value={canForecast ? `${(revenueNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—'} status={canForecast ? 'good' : 'neutral'} trend="Tạm tính +4%" />
        <MetricCard label="Dự toán tổng chi" value={canForecast ? `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—'} status={cashOutNext ? 'warning' : 'neutral'} trend="Theo sổ quỹ tuần này" />
        <MetricCard label="Số dư cuối tuần dự kiến" value={canForecast ? `${(endingNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—'} status={endingNext < 0 ? 'danger' : canForecast ? 'good' : 'neutral'} trend="Dòng tiền tạm" />
        <MetricCard label="Mức tin cậy" value={canForecast ? 'Tạm' : 'Thấp'} status={canForecast ? 'warning' : 'neutral'} trend="Cần thêm lịch sử nhiều tuần" />
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Dự toán thu theo kênh</CardTitle>
          <div className="mt-3"><ReportTable headers={['Kênh', 'Thực tế tuần vừa rồi', 'Dự toán tuần tới', 'Tăng/giảm', 'Lý do']} rows={revenueRows} /></div>
        </Card>
        <Card>
          <CardTitle>Dự toán chi theo nhóm</CardTitle>
          <div className="mt-3"><ReportTable headers={['Nhóm chi', 'Thực tế tuần vừa rồi', 'Dự toán tuần tới', 'Cần CEO duyệt', 'Ghi chú']} rows={costRows} /></div>
        </Card>
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Thu dự kiến vs chi dự kiến" items={[{ label: 'Thu dự kiến', value: revenueNext, caption: canForecast ? `${(revenueNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' }, { label: 'Chi dự kiến', value: cashOutNext, caption: canForecast ? `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' }]} />
        <Card>
          <CardTitle>Dự toán dòng tiền</CardTitle>
          <div className="mt-3"><ReportTable headers={['Chỉ số', 'Số tiền']} rows={[[ 'Dòng tiền hiện tại', canForecast ? report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—' : 'Chưa đủ dữ liệu' ], [ 'Tiền thu dự kiến', canForecast ? `${(revenueNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' ], [ 'Tổng chi dự kiến', canForecast ? `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' ], [ 'Số dư cuối tuần dự kiến', canForecast ? `${(endingNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' ], [ 'Cảnh báo thiếu tiền', canForecast ? (endingNext < 0 ? 'Có' : 'Không') : 'Chưa đủ dữ liệu' ]]} /></div>
        </Card>
      </section>
    </div>
  );
}
