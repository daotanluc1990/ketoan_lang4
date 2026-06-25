import { PageHeader } from '@/components/layout/PageHeader';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

export default async function DongTienPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  return (
    <div className="space-y-3">
      <PageHeader title="Dòng tiền Tuần" description="Xem tiền vào, tiền ra và các nhóm chi chính." status={report.sourceCounts.cashbook ? 'Tốt' : 'Chưa đủ dữ liệu'} />
      <Card>
        <CardTitle>Bảng dòng tiền tuần</CardTitle>
        <div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Đối chiếu', 'Ghi chú']} rows={report.cashflowRows} maxHeight="max-h-[420px]" /></div>
      </Card>
      <Card>
        <CardTitle>Chi theo nhóm</CardTitle>
        <div className="mt-2"><ReportTable headers={['Nguồn', 'Nhóm chi', 'Số tiền', 'Tuần trước', 'Tỷ trọng', 'Trạng thái', 'Ghi chú']} rows={report.cashbookGroupRows} maxHeight="max-h-[420px]" /></div>
      </Card>
    </div>
  );
}
