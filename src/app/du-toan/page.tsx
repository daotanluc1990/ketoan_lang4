import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 60;

export default async function DuToanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const canForecast = report.hasRealData && report.sourceCounts.cashbook > 0 && (report.sourceCounts.appRevenue > 0 || report.sourceCounts.storeRevenue > 0);
  const revenueNext = report.totals.revenue * 1.04;
  const cashOutNext = report.totals.cashOut || 0;
  const endingNext = report.totals.cashEnding + revenueNext - cashOutNext;
  const money = (value: number) => `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  const revenueRows = canForecast ? [['Tổng doanh thu', report.executiveKpis[0]?.value ?? '—', money(revenueNext), '+4,0%', 'Tạm tính']] : [['Tổng doanh thu', 'Chưa đủ dữ liệu', '—', '—', 'Cần doanh thu thật']];
  const costRows = canForecast ? [['Chi theo sổ quỹ', money(cashOutNext), money(cashOutNext), 'Cần xem xét', 'Theo tuần hiện tại']] : [['Chi theo sổ quỹ', 'Chưa đủ dữ liệu', '—', 'Không', 'Cần sổ quỹ thật']];

  return (
    <div className="space-y-2.5">
      <PageHeader title="Dự toán tuần tới" description="Dự toán tạm khi đã có doanh thu và sổ quỹ thật." status={canForecast ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      {!canForecast ? <EmptyState title="Chưa đủ dữ liệu để dự toán" description="Cần ít nhất doanh thu thật và sổ quỹ thật." /> : null}
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Doanh thu dự kiến" value={canForecast ? money(revenueNext) : '—'} status={canForecast ? 'good' : 'neutral'} trend="Tạm tính +4%" compact />
        <MetricCard label="Tổng chi dự kiến" value={canForecast ? money(cashOutNext) : '—'} status={cashOutNext ? 'warning' : 'neutral'} trend="Theo sổ quỹ" compact />
        <MetricCard label="Số dư dự kiến" value={canForecast ? money(endingNext) : '—'} status={endingNext < 0 ? 'danger' : canForecast ? 'good' : 'neutral'} trend="Cuối tuần" compact />
        <MetricCard label="Mức tin cậy" value={canForecast ? 'Tạm' : 'Thấp'} status={canForecast ? 'warning' : 'neutral'} trend="Cần thêm lịch sử" compact />
      </section>
      <section className="grid gap-2 xl:grid-cols-2">
        <Card><CardTitle>Dự toán thu</CardTitle><div className="mt-2"><ReportTable headers={['Kênh', 'Tuần vừa rồi', 'Tuần tới', 'Tăng/giảm', 'Lý do']} rows={revenueRows} maxHeight="max-h-[220px]" /></div></Card>
        <Card><CardTitle>Dự toán chi</CardTitle><div className="mt-2"><ReportTable headers={['Nhóm chi', 'Tuần vừa rồi', 'Tuần tới', 'Duyệt?', 'Ghi chú']} rows={costRows} maxHeight="max-h-[220px]" /></div></Card>
      </section>
      <Card><CardTitle>Dự toán dòng tiền</CardTitle><div className="mt-2"><ReportTable headers={['Chỉ số', 'Số tiền']} rows={[[ 'Dòng tiền hiện tại', canForecast ? report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—' : 'Chưa đủ dữ liệu' ], [ 'Tiền thu dự kiến', canForecast ? money(revenueNext) : '—' ], [ 'Tổng chi dự kiến', canForecast ? money(cashOutNext) : '—' ], [ 'Số dư dự kiến', canForecast ? money(endingNext) : '—' ]]} maxHeight="max-h-[220px]" /></div></Card>
    </div>
  );
}
