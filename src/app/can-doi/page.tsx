import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 60;

export default async function CanDoiPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const hasBalanceData = report.sourceCounts.cashbook > 0 || report.sourceCounts.inventory > 0 || report.sourceCounts.lossRows > 0;
  const warningRows = [
    ['Tồn âm', `${report.totals.negativeStockCount} mặt hàng`, 'Rà nhập/xuất/kiểm kê'],
    ['Nguồn thiếu', report.missingSources.length ? report.missingSources.join(', ') : 'Không thiếu', 'Bổ sung trước khi chốt'],
    ['Trạng thái', hasBalanceData ? 'Có dữ liệu' : 'Chưa đủ', 'Đối chiếu trước khi gửi']
  ];

  return (
    <div className="space-y-2.5">
      <PageHeader title="Cân đối rút gọn" description="Tiền, tồn kho, thất thoát và nguồn còn thiếu." status={hasBalanceData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      {!hasBalanceData ? <EmptyState title="Chưa đủ dữ liệu cân đối" description="Cần import sổ quỹ, tồn kho và thất thoát." /> : null}
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Dòng tiền tạm" value={report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—'} status={report.totals.cashEnding < 0 ? 'danger' : hasBalanceData ? 'good' : 'neutral'} trend="Từ sổ quỹ" compact />
        <MetricCard label="Tồn kho" value={report.executiveKpis.find((kpi) => kpi.label === 'Tồn kho')?.value ?? '—'} status={report.totals.negativeStockCount ? 'warning' : hasBalanceData ? 'good' : 'neutral'} trend={`${report.totals.negativeStockCount} tồn âm`} compact />
        <MetricCard label="Thất thoát" value={report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—'} status={report.totals.lossValue ? 'warning' : 'neutral'} trend="Theo NVL" compact />
        <MetricCard label="Nguồn thiếu" value={`${report.missingSources.length}`} status={report.missingSources.length ? 'warning' : 'good'} trend={report.missingSources.length ? 'Cần bổ sung' : 'Đủ nguồn'} compact />
      </section>
      <section className="grid gap-2 xl:grid-cols-[minmax(0,2fr)_minmax(260px,0.8fr)]">
        <Card><CardTitle>Bảng cân đối rút gọn</CardTitle><div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Trạng thái', 'Ghi chú']} rows={report.balanceRows} maxHeight="max-h-[390px]" /></div></Card>
        <Card><CardTitle>Cảnh báo cần xem</CardTitle><div className="mt-2"><ReportTable headers={['Mục', 'Giá trị', 'Hành động']} rows={warningRows} maxHeight="max-h-[220px]" /></div></Card>
      </section>
      <Card><CardTitle>Giới hạn cần kế toán rà</CardTitle><div className="mt-2"><ReportTable headers={['Nhóm', 'Vấn đề', 'Ảnh hưởng', 'Hành động']} rows={report.financeLimitationRows} maxHeight="max-h-[260px]" /></div></Card>
    </div>
  );
}
