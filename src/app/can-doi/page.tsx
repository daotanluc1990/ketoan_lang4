import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormulaEvidencePanel } from '@/components/finance/FormulaEvidencePanel';
import { DataLimitationNotice } from '@/components/finance/DataLimitationNotice';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

export default async function CanDoiPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const hasBalanceData = report.sourceCounts.cashbook > 0 || report.sourceCounts.inventory > 0 || report.sourceCounts.lossRows > 0;
  return (
    <div className="space-y-4">
      <PageHeader title="Cân đối rút gọn" description="CEO biết tiền đang nằm ở đâu dựa trên Google Sheet thật. Không dùng số mẫu khi sheet trống." status={hasBalanceData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      {!hasBalanceData ? <EmptyState title="Chưa đủ dữ liệu cân đối" description="Cần import sổ quỹ, tồn kho và thất thoát trước khi xem cân đối rút gọn." /> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Dòng tiền tạm" value={report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—'} status={report.totals.cashEnding < 0 ? 'danger' : hasBalanceData ? 'good' : 'neutral'} trend="Từ sổ quỹ" />
        <MetricCard label="Giá trị tồn kho" value={report.executiveKpis.find((kpi) => kpi.label === 'Tồn kho')?.value ?? '—'} status={report.totals.negativeStockCount ? 'warning' : hasBalanceData ? 'good' : 'neutral'} trend={`${report.totals.negativeStockCount} tồn âm`} />
        <MetricCard label="Thất thoát quy tiền" value={report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—'} status={report.totals.lossValue ? 'warning' : 'neutral'} trend={`${report.sourceCounts.lossRows} dòng NVL`} />
        <MetricCard label="Nguồn còn thiếu" value={`${report.missingSources.length}`} status={report.missingSources.length ? 'warning' : 'good'} trend={report.missingSources.length ? report.missingSources.join(', ') : 'Đủ nguồn chính'} />
      </section>
      <section className="grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle>Bảng cân đối rút gọn</CardTitle>
          <div className="mt-3"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Trạng thái', 'Ghi chú']} rows={report.balanceRows} /></div>
        </Card>
        <Card>
          <CardTitle>Cảnh báo mất cân đối</CardTitle>
          <div className="mt-3 space-y-3 text-sm text-black/70">
            <p><strong>Dữ liệu:</strong> {report.message}</p>
            <p><strong>Tồn âm:</strong> {report.totals.negativeStockCount} mặt hàng.</p>
            <p><strong>Lưu ý:</strong> Công nợ và tài sản cố định chưa kết luận nếu chưa có dữ liệu import riêng.</p>
          </div>
        </Card>
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Tiền và tồn kho" items={[{ label: 'Dòng tiền tạm', value: Math.abs(report.totals.cashEnding), caption: report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value }, { label: 'Tồn kho', value: report.totals.inventoryValue, caption: report.executiveKpis.find((kpi) => kpi.label === 'Tồn kho')?.value }]} />
        <ChartCard title="Nguồn dữ liệu cân đối" items={[{ label: 'Sổ quỹ', value: report.sourceCounts.cashbook, caption: `${report.sourceCounts.cashbook} dòng` }, { label: 'Tồn kho', value: report.sourceCounts.inventory, caption: `${report.sourceCounts.inventory} dòng` }, { label: 'Thất thoát', value: report.sourceCounts.lossRows, caption: `${report.sourceCounts.lossRows} dòng` }]} />
      </section>
      <DataLimitationNotice rows={report.financeLimitationRows.filter((row) => row[0] === 'Cân đối')} />
      <FormulaEvidencePanel rows={report.financeEvidenceRows.filter((row) => ['Tiền tạm tính', 'Tồn kho', 'Công nợ phải trả', 'Capex/đầu tư', 'Tác động giá thu mua'].includes(row[0]))} />
    </div>
  );
}
