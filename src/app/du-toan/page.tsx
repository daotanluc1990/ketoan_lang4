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
  const revenueRows = canForecast ? [[ 'Tổng doanh thu', report.executiveKpis[0]?.value ?? '—', `${(revenueNext / 1_000_000).toFixed(1).replace('.', ',')}tr`, '+4,0%', 'Tạm tính từ tuần hiện tại' ]] : [[ 'Tổng doanh thu', 'Chưa đủ dữ liệu', '—', '—', 'Cần doanh thu thật' ]];
  const costRows = canForecast ? [[ 'Chi theo sổ quỹ', `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr`, `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr`, cashOutNext ? 'Cần xem xét' : 'Không', 'Theo tiền ra tuần hiện tại' ]] : [[ 'Chi theo sổ quỹ', 'Chưa đủ dữ liệu', '—', 'Không', 'Cần sổ quỹ thật' ]];

  return (
    <div className="space-y-2.5">
      <PageHeader title="Dự toán tuần tới" description="Dự toán tạm khi đã có doanh thu và sổ quỹ thật." status={canForecast ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      {!canForecast ? <EmptyState title="Chưa đủ dữ liệu để dự toán" description="Cần ít nhất doanh thu thật và sổ quỹ thật." /> : null}
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Doanh thu dự kiến" value={canForecast ? `${(revenueNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—'} status={canForecast ? 'good' : 'neutral'} trend="Tạm tính +4%" compact />
        <MetricCard label="Tổng chi dự kiến" value={canForecast ? `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—'} status={cashOutNext ? 'warning' : 'neutral'} trend="Theo sổ quỹ" compact />
        <MetricCard label="Số dư dự kiến" value={canForecast ? `${(endingNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—'} status={endingNext < 0 ? 'danger' : canForecast ? 'good' : 'neutral'} trend="Cuối tuần" compact />
        <MetricCard label="Mức tin cậy" value={canForecast ? 'Tạm' : 'Thấp'} status={canForecast ? 'warning' : 'neutral'} trend="Cần thêm lịch sử" compact />
      </section>
      <section className="grid gap-2.5 xl:grid-cols-2">
        <Card>
          <CardTitle>Dự toán thu</CardTitle>
          <div className="mt-2"><ReportTable headers={['Kênh', 'Tuần vừa rồi', 'Tuần tới', 'Tăng/giảm', 'Lý do']} rows={revenueRows} maxHeight="max-h-[220px]" /></div>
        </Card>
        <Card>
          <CardTitle>Dự toán chi</CardTitle>
          <div className="mt-2"><ReportTable headers={['Nhóm chi', 'Tuần vừa rồi', 'Tuần tới', 'CEO duyệt?', 'Ghi chú']} rows={costRows} maxHeight="max-h-[220px]" /></div>
        </Card>
      </section>
      <section className="grid gap-2.5 xl:grid-cols-[1fr_1fr]">
        <ChartCard title="Thu dự kiến vs chi dự kiến" items={[{ label: 'Thu dự kiến', value: revenueNext, caption: canForecast ? `${(revenueNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' }, { label: 'Chi dự kiến', value: cashOutNext, caption: canForecast ? `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' }]} />
        <Card>
          <CardTitle>Dự toán dòng tiền</CardTitle>
          <div className="mt-2"><ReportTable headers={['Chỉ số', 'Số tiền']} rows={[[ 'Dòng tiền hiện tại', canForecast ? report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—' : 'Chưa đủ dữ liệu' ], [ 'Tiền thu dự kiến', canForecast ? `${(revenueNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' ], [ 'Tổng chi dự kiến', canForecast ? `${(cashOutNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' ], [ 'Số dư cuối tuần dự kiến', canForecast ? `${(endingNext / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' ], [ 'Cảnh báo thiếu tiền', canForecast ? (endingNext < 0 ? 'Có' : 'Không') : 'Chưa đủ dữ liệu' ]]} maxHeight="max-h-[220px]" /></div>
        </Card>
      </section>
    </div>
  );
}
