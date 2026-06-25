import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
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
  return (
    <div className="space-y-3">
      <PageHeader title="Cân đối rút gọn" description="Xem tiền, tồn kho, thất thoát và công nợ cần theo dõi." status={hasBalanceData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      {!hasBalanceData ? <EmptyState title="Chưa đủ dữ liệu cân đối" description="Cần import sổ quỹ, tồn kho và thất thoát trước khi xem cân đối." /> : null}
      {report.financeLimitationRows.filter((row) => row[0] === 'Cân đối').length ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Còn {report.financeLimitationRows.filter((row) => row[0] === 'Cân đối').length} điểm dữ liệu cần kế toán rà soát trước khi chốt.
        </section>
      ) : null}
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Dòng tiền tạm" value={report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—'} status={report.totals.cashEnding < 0 ? 'danger' : hasBalanceData ? 'good' : 'neutral'} trend="Từ sổ quỹ" compact />
        <MetricCard label="Giá trị tồn kho" value={report.executiveKpis.find((kpi) => kpi.label === 'Tồn kho')?.value ?? '—'} status={report.totals.negativeStockCount ? 'warning' : hasBalanceData ? 'good' : 'neutral'} trend={`${report.totals.negativeStockCount} tồn âm`} compact />
        <MetricCard label="Thất thoát quy tiền" value={report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—'} status={report.totals.lossValue ? 'warning' : 'neutral'} trend="Theo NVL" compact />
        <MetricCard label="Nguồn còn thiếu" value={`${report.missingSources.length}`} status={report.missingSources.length ? 'warning' : 'good'} trend={report.missingSources.length ? 'Cần bổ sung' : 'Đủ nguồn chính'} compact />
      </section>
      <section className="grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle>Bảng cân đối rút gọn</CardTitle>
          <div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Trạng thái', 'Ghi chú']} rows={report.balanceRows} maxHeight="max-h-[460px]" /></div>
        </Card>
        <Card>
          <CardTitle>Cảnh báo cần xem</CardTitle>
          <div className="mt-2 space-y-2 text-sm text-black/70">
            <p><strong>Tồn âm:</strong> {report.totals.negativeStockCount} mặt hàng.</p>
            <p><strong>Nguồn thiếu:</strong> {report.missingSources.length ? report.missingSources.join(', ') : 'Không thiếu nguồn chính'}.</p>
            <p><strong>Lưu ý:</strong> Chỉ chốt khi công nợ, tồn kho và sổ quỹ đã đối chiếu.</p>
          </div>
        </Card>
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Tiền và tồn kho" items={[{ label: 'Dòng tiền tạm', value: Math.abs(report.totals.cashEnding), caption: report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value }, { label: 'Tồn kho', value: report.totals.inventoryValue, caption: report.executiveKpis.find((kpi) => kpi.label === 'Tồn kho')?.value }]} />
        <ChartCard title="Rủi ro cần xử lý" items={[{ label: 'Nguồn thiếu', value: report.missingSources.length, caption: `${report.missingSources.length} nguồn` }, { label: 'Tồn âm', value: report.totals.negativeStockCount, caption: `${report.totals.negativeStockCount} mặt hàng` }, { label: 'Thất thoát', value: report.totals.lossValue, caption: report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value }]} />
      </section>
    </div>
  );
}
