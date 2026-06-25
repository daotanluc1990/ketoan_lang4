import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

function parseMoneyText(text: string) {
  return Number(text.replace(',', '.').replace('tr', '').replace(' tỷ', '')) || 0;
}

export default async function ThatThoatChiTietPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const hasLoss = report.sourceCounts.lossRows > 0;
  return (
    <div className="space-y-2.5">
      <PageHeader title="Báo cáo thất thoát chi tiết" description="NVL thiếu/dư, giá trị lệch và hành động xử lý." status={hasLoss ? 'Cảnh báo' : 'Chưa đủ dữ liệu'} />
      {!hasLoss ? <EmptyState title="Chưa đủ dữ liệu thất thoát" description="Hãy import báo cáo thất thoát hoặc dữ liệu NVL đã chuẩn hóa." /> : null}
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Thất thoát quy tiền" value={report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—'} status={report.totals.lossValue ? 'warning' : 'neutral'} trend="Tổng giá trị lệch" compact />
        <MetricCard label="NVL theo dõi" value={`${report.sourceCounts.lossRows}`} status={hasLoss ? 'good' : 'neutral'} trend="Đã có dữ liệu" compact />
        <MetricCard label="Top cảnh báo" value={report.lossTop5Rows[0]?.[0] ?? '—'} status={report.lossTop5Rows.length ? 'warning' : 'neutral'} trend={report.lossTop5Rows[0]?.[3] ?? 'Chưa có'} compact />
        <MetricCard label="Quy ước lệch" value="Âm = thiếu" status="warning" trend="Dương = dư" compact />
      </section>
      <section className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ChartCard title="Top 5 theo giá trị" items={report.lossTop5Rows.map((row) => ({ label: row[0], value: parseMoneyText(row[3]), caption: row[3] }))} />
        <Card>
          <CardTitle>Top nguyên liệu cần xử lý</CardTitle>
          <div className="mt-2"><ReportTable headers={['NVL', 'ĐVT', 'Chênh SL', 'Giá trị', 'Tỷ lệ', 'Trạng thái', 'Hành động']} rows={report.lossTop5Rows.map((row) => [row[0], row[1], row[2], row[3], row[4], row[7], row[8]])} maxHeight="max-h-[320px]" /></div>
        </Card>
      </section>
    </div>
  );
}
