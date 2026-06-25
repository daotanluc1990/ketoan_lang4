import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

export default async function CanDoiPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const hasBalanceData = report.sourceCounts.cashbook > 0 || report.sourceCounts.inventory > 0 || report.sourceCounts.lossRows > 0;
  const limitationCount = report.financeLimitationRows.filter((row) => row[0] === 'Cân đối').length;
  return (
    <div className="space-y-2.5">
      <PageHeader title="Cân đối rút gọn" description="Tiền, tồn kho, thất thoát và nguồn còn thiếu trước khi chốt." status={hasBalanceData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      {!hasBalanceData ? <EmptyState title="Chưa đủ dữ liệu cân đối" description="Cần import sổ quỹ, tồn kho và thất thoát trước khi xem cân đối." /> : null}
      {limitationCount ? <section className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 md:text-sm">Còn {limitationCount} điểm cần kế toán rà trước khi chốt.</section> : null}
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Dòng tiền tạm" value={report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—'} status={report.totals.cashEnding < 0 ? 'danger' : hasBalanceData ? 'good' : 'neutral'} trend="Từ sổ quỹ" compact />
        <MetricCard label="Tồn kho" value={report.executiveKpis.find((kpi) => kpi.label === 'Tồn kho')?.value ?? '—'} status={report.totals.negativeStockCount ? 'warning' : hasBalanceData ? 'good' : 'neutral'} trend={`${report.totals.negativeStockCount} tồn âm`} compact />
        <MetricCard label="Thất thoát" value={report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—'} status={report.totals.lossValue ? 'warning' : 'neutral'} trend="Theo NVL" compact />
        <MetricCard label="Nguồn thiếu" value={`${report.missingSources.length}`} status={report.missingSources.length ? 'warning' : 'good'} trend={report.missingSources.length ? 'Cần bổ sung' : 'Đủ nguồn'} compact />
      </section>
      <section className="grid gap-2.5 xl:grid-cols-[minmax(0,2fr)_minmax(260px,0.8fr)]">
        <Card>
          <CardTitle>Bảng cân đối rút gọn</CardTitle>
          <div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Trạng thái', 'Ghi chú']} rows={report.balanceRows} maxHeight="max-h-[430px]" /></div>
        </Card>
        <Card>
          <CardTitle>Cảnh báo cần xem</CardTitle>
          <div className="mt-2 space-y-1.5 text-xs leading-5 text-black/65 md:text-sm">
            <p><strong>Tồn âm:</strong> {report.totals.negativeStockCount} mặt hàng.</p>
            <p><strong>Nguồn thiếu:</strong> {report.missingSources.length ? report.missingSources.join(', ') : 'Không thiếu nguồn chính'}.</p>
            <p><strong>Chốt báo cáo:</strong> chỉ chốt khi sổ quỹ, tồn kho, công nợ đã đối chiếu.</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
