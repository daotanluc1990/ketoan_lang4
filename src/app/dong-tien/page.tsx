import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

export default async function DongTienPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const hasCashbook = report.sourceCounts.cashbook > 0;
  const moneyIn = report.executiveKpis.find((kpi) => kpi.label === 'Tiền vào');
  const moneyOut = report.executiveKpis.find((kpi) => kpi.label === 'Tiền ra');
  const cashEnding = report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm');
  const unclassified = report.executiveKpis.find((kpi) => kpi.label === 'Chi cần phân loại');

  return (
    <div className="space-y-2.5">
      <PageHeader title="Dòng tiền Tuần" description="Tiền vào, tiền ra, dòng tiền tạm và nhóm chi cần xử lý." status={hasCashbook ? 'Tốt' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tiền vào" value={moneyIn?.value ?? '—'} status={hasCashbook ? 'good' : 'neutral'} trend="Đã ghi nhận thu" compact />
        <MetricCard label="Tiền ra" value={moneyOut?.value ?? '—'} status={hasCashbook ? 'warning' : 'neutral'} trend="Đã ghi nhận chi" compact />
        <MetricCard label="Dòng tiền tạm" value={cashEnding?.value ?? '—'} status={report.totals.cashEnding < 0 ? 'danger' : hasCashbook ? 'good' : 'neutral'} trend="Thu - chi" compact />
        <MetricCard label="Chi cần phân loại" value={unclassified?.value ?? '—'} status={report.totals.cashUnclassifiedOut ? 'warning' : hasCashbook ? 'good' : 'neutral'} trend="Kế toán rà" compact />
      </section>
      <section className="grid gap-2.5 xl:grid-cols-2">
        <Card>
          <CardTitle>Bảng dòng tiền tuần</CardTitle>
          <div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Đối chiếu', 'Ghi chú']} rows={report.cashflowRows} maxHeight="max-h-[360px]" /></div>
        </Card>
        <Card>
          <CardTitle>Chi theo nhóm</CardTitle>
          <div className="mt-2"><ReportTable headers={['Nguồn', 'Nhóm chi', 'Số tiền', 'Tuần trước', 'Tỷ trọng', 'Trạng thái', 'Ghi chú']} rows={report.cashbookGroupRows} maxHeight="max-h-[360px]" /></div>
        </Card>
      </section>
    </div>
  );
}
