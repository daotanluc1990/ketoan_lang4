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

function parseMoneyText(text: string) {
  return Number(text.replace(',', '.').replace('tr', '').replace(' tỷ', '')) || 0;
}

function parsePercentText(text: string) {
  return Number(text.replace(',', '.').replace('%', '')) || 0;
}

export default async function ThatThoatChiTietPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const hasLoss = report.sourceCounts.lossRows > 0;
  return (
    <div className="space-y-4">
      <PageHeader title="Báo cáo thất thoát chi tiết" description="Chi tiết NVL thất thoát chỉ lấy từ DL_THAT_THOAT_NVL trong Google Sheet/data store." status={hasLoss ? 'Cảnh báo' : 'Chưa đủ dữ liệu'} />
      {!hasLoss ? <EmptyState title="Chưa đủ dữ liệu thất thoát" description="Chưa có dữ liệu trong DL_THAT_THOAT_NVL. Hãy import file BÁO CÁO THẤT THOÁT NVL TUẦN và xác nhận ghi Google Sheet." /> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tổng thất thoát quy tiền" value={report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—'} status={report.totals.lossValue ? 'warning' : 'neutral'} trend={`${report.sourceCounts.lossRows} dòng NVL`} />
        <MetricCard label="Số NVL có dữ liệu" value={`${report.sourceCounts.lossRows}`} status={hasLoss ? 'good' : 'neutral'} trend="Từ Google Sheet" />
        <MetricCard label="Top cảnh báo" value={report.lossTop5Rows[0]?.[0] ?? '—'} status={report.lossTop5Rows.length ? 'warning' : 'neutral'} trend={report.lossTop5Rows[0]?.[3] ?? 'Chưa có'} />
        <MetricCard label="Nguồn dữ liệu" value={hasLoss ? 'Thật' : 'Trống'} status={hasLoss ? 'good' : 'neutral'} trend="Không dùng số mẫu" />
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Top 5 thất thoát theo giá trị" items={report.lossTop5Rows.map((row) => ({ label: row[0], value: parseMoneyText(row[3]), caption: row[3] }))} />
        <ChartCard title="Tỷ lệ thất thoát" items={report.lossTop5Rows.map((row) => ({ label: row[0], value: parsePercentText(row[4]), caption: row[4] }))} />
      </section>
      <Card>
        <CardTitle>Top 5 nguyên liệu thất thoát cần xử lý</CardTitle>
        <div className="mt-3"><ReportTable headers={['NVL', 'ĐVT', 'Chênh SL', 'Giá trị lệch', 'Tỷ lệ thất thoát', 'Định mức', 'Vượt định mức', 'Trạng thái', 'Hành động']} rows={report.lossTop5Rows} /></div>
      </Card>
      <DataLimitationNotice rows={report.financeLimitationRows.filter((row) => row[0] === 'Thất thoát')} />
      <FormulaEvidencePanel rows={report.financeEvidenceRows.filter((row) => ['Tổng thất thoát quy tiền', 'Xếp hạng thất thoát'].includes(row[0]))} />
    </div>
  );
}
