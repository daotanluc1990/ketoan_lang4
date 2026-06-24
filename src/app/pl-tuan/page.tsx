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

export default async function PlTuanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const status = report.hasRealData ? (report.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu';
  return (
    <div className="space-y-4">
      <PageHeader title="P&L Tuần" description="P&L chỉ hiển thị dữ liệu thật đã ghi vào Google Sheet. Không dùng số mẫu khi sheet trống." status={status} />
      {!report.hasRealData ? <EmptyState title="Chưa đủ dữ liệu để kết luận" description="Chưa có dữ liệu import thật trong Google Sheet. Hãy import doanh thu app, doanh thu cửa hàng, sổ quỹ, tồn kho và thất thoát trước." /> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {report.executiveKpis.slice(0, 8).map((kpi) => <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} trend={kpi.trend} status={kpi.status} />)}
      </section>
      <section className="grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle>Bảng P&L chính</CardTitle>
          <div className="mt-3"><ReportTable headers={['Nhóm', 'Chỉ số', 'Tuần này', 'Tuần trước', 'Chênh lệch', 'Tỷ lệ', 'Đánh giá']} rows={report.pnlRows} /></div>
        </Card>
        <Card>
          <CardTitle>Nhận xét kế toán bắt buộc</CardTitle>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-black/70">
            <li>{report.hasRealData ? 'Báo cáo đang đọc dữ liệu import thật.' : 'Chưa đủ dữ liệu để kết luận.'}</li>
            <li>Không chốt P&L nếu còn thiếu doanh thu app, doanh thu cửa hàng, sổ quỹ, tồn kho hoặc thất thoát.</li>
            <li>Thiếu nguồn hiện tại: {report.missingSources.length ? report.missingSources.join(', ') : 'Không thiếu nguồn chính'}.</li>
          </ol>
        </Card>
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Doanh thu theo nguồn" items={report.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue }))} />
        <ChartCard title="Tỷ lệ chính" items={[{ label: 'COGS tạm tính', value: report.totals.cogsPercent * 100, caption: `${(report.totals.cogsPercent * 100).toFixed(1)}%` }, { label: 'App fee%', value: report.totals.appFeePercent * 100, caption: `${(report.totals.appFeePercent * 100).toFixed(1)}%` }]} />
      </section>
      <Card>
        <CardTitle>Tóm tắt Top 5 thất thoát đưa vào P&L</CardTitle>
        <div className="mt-3"><ReportTable headers={['NVL', 'ĐVT', 'Chênh SL', 'Giá trị lệch', 'Tỷ lệ', 'Định mức', 'Vượt', 'Trạng thái', 'Hành động']} rows={report.lossTop5Rows} /></div>
      </Card>
      <DataLimitationNotice rows={report.financeLimitationRows.filter((row) => row[0] === 'P&L')} />
      <FormulaEvidencePanel rows={report.financeEvidenceRows.filter((row) => ['Doanh thu cửa hàng', 'Doanh thu app net', 'Giá vốn biết được', 'Chi phí vận hành từ sổ quỹ', 'Lợi nhuận ròng tạm'].includes(row[0]))} />
    </div>
  );
}
