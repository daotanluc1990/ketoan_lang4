import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { buildSnapshotCashflowReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

export default async function DongTienPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotCashflowReport(await resolvePageSearchParams(searchParams));
  const hasCashbook = report.sourceCounts.cashbook > 0;
  const moneyIn = report.executiveKpis.find((kpi) => kpi.label === 'Tiền vào');
  const moneyOut = report.executiveKpis.find((kpi) => kpi.label === 'Tiền ra');
  const cashEnding = report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm');
  const unclassified = report.executiveKpis.find((kpi) => kpi.label === 'Chi cần phân loại');
  return (
    <div className="space-y-2.5">
      <PageHeader title="Dòng tiền Tuần" description="Tiền vào, tiền ra, chi Chi nhánh/BTT và khoản cần rà." status={hasCashbook ? 'Tốt' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4"><MetricCard label="Tiền vào" value={moneyIn?.value ?? '—'} status={hasCashbook ? 'good' : 'neutral'} trend="Đã ghi nhận thu" compact /><MetricCard label="Tiền ra" value={moneyOut?.value ?? '—'} status={hasCashbook ? 'warning' : 'neutral'} trend="Đã ghi nhận chi" compact /><MetricCard label="Dòng tiền tạm" value={cashEnding?.value ?? '—'} status={report.totals.cashEnding < 0 ? 'danger' : hasCashbook ? 'good' : 'neutral'} trend="Thu - chi" compact /><MetricCard label="Chi cần phân loại" value={unclassified?.value ?? '—'} status={report.totals.cashUnclassifiedOut ? 'warning' : hasCashbook ? 'good' : 'neutral'} trend="Kế toán rà" compact /></section>
      <section className="grid gap-2 xl:grid-cols-2"><Card><CardTitle>Bảng dòng tiền tuần</CardTitle><div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Đối chiếu', 'Ghi chú']} rows={report.cashflowRows} maxHeight="max-h-[340px]" /></div></Card><Card><CardTitle>Chi theo đơn vị chịu chi & bản chất kế toán</CardTitle><div className="mt-2"><ReportTable headers={['Đơn vị chịu chi', 'Bản chất chi', 'Số tiền', 'Xử lý kế toán', 'Tỷ trọng', 'Trạng thái', 'Hành động']} rows={report.cashbookGroupRows} maxHeight="max-h-[340px]" /></div></Card></section>
      <Card><CardTitle>Khoản chi lớn / cần đối chiếu</CardTitle><div className="mt-2"><ReportTable headers={['Ngày', 'Mã tuần', 'Đơn vị chịu chi', 'Bản chất chi', 'Xử lý kế toán', 'Diễn giải', 'Số tiền', 'Trạng thái', 'Hành động']} rows={report.cashbookLargeExpenseRows} maxHeight="max-h-[300px]" /></div></Card>
    </div>
  );
}
