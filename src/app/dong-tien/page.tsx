import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

export default async function DongTienPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const hasCashbook = report.sourceCounts.cashbook > 0;
  return (
    <div className="space-y-4">
      <PageHeader title="Dòng tiền Tuần" description="Tiền thật vào/ra từ Google Sheet. Nếu chưa import sổ quỹ thì không hiển thị số mẫu." status={hasCashbook ? 'Tốt' : 'Chưa đủ dữ liệu'} />
      {!hasCashbook ? <EmptyState title="Chưa đủ dữ liệu dòng tiền" description="Chưa có dữ liệu trong DL_SO_QUY. Hãy import file Sổ quỹ và xác nhận ghi Google Sheet." /> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tổng tiền vào" value={report.executiveKpis.find((kpi) => kpi.label === 'Tiền vào')?.value ?? '—'} status={hasCashbook ? 'good' : 'neutral'} trend={`${report.sourceCounts.cashbook} dòng sổ quỹ`} />
        <MetricCard label="Tổng tiền ra" value={report.executiveKpis.find((kpi) => kpi.label === 'Tiền ra')?.value ?? '—'} status={hasCashbook ? 'warning' : 'neutral'} trend="Tính từ số tiền âm" />
        <MetricCard label="Dòng tiền tạm" value={report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—'} status={report.totals.cashEnding < 0 ? 'danger' : hasCashbook ? 'good' : 'neutral'} trend="Thu - chi" />
        <MetricCard label="Chi cần phân loại" value={report.executiveKpis.find((kpi) => kpi.label === 'Chi cần phân loại')?.value ?? '—'} status={report.totals.cashUnclassifiedOut ? 'warning' : hasCashbook ? 'good' : 'neutral'} trend="Từ diễn giải sổ quỹ" />
        <MetricCard label="Lịch sử import" value={`${report.sourceCounts.importHistory}`} status={report.sourceCounts.importHistory ? 'good' : 'neutral'} trend="Dòng IMPORT_LICH_SU" />
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Thu - chi theo sổ quỹ" items={[{ label: 'Tiền vào', value: report.totals.cashIn, caption: report.executiveKpis.find((kpi) => kpi.label === 'Tiền vào')?.value }, { label: 'Tiền ra', value: report.totals.cashOut, caption: report.executiveKpis.find((kpi) => kpi.label === 'Tiền ra')?.value }]} />
        <ChartCard title="Nguồn dữ liệu dòng tiền" items={[{ label: 'Sổ quỹ', value: report.sourceCounts.cashbook, caption: `${report.sourceCounts.cashbook} dòng` }, { label: 'Chi vận hành tạm', value: report.totals.cashOperatingOut, caption: report.totals.cashOperatingOut ? `${(report.totals.cashOperatingOut / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' }, { label: 'Cần phân loại', value: report.totals.cashUnclassifiedOut, caption: report.totals.cashUnclassifiedOut ? `${(report.totals.cashUnclassifiedOut / 1_000_000).toFixed(1).replace('.', ',')}tr` : '—' }, { label: 'Audit log', value: report.sourceCounts.auditRows, caption: `${report.sourceCounts.auditRows} dòng` }]} />
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Bảng dòng tiền tuần</CardTitle>
          <div className="mt-3"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Đối chiếu', 'Ghi chú']} rows={report.cashflowRows} /></div>
        </Card>
        <Card>
          <CardTitle>So sánh với tuần trước</CardTitle>
          <p className="mt-2 text-sm text-black/60">Chỉ hoạt động đầy đủ khi đang lọc theo Mã tuần.</p>
          <div className="mt-3"><ReportTable headers={['Chỉ số', 'Tuần đang xem', 'Tuần trước', 'Chênh lệch', 'Trạng thái']} rows={report.cashflowTrendRows} /></div>
        </Card>
      </section>
      <Card>
        <CardTitle>Lịch sử dòng tiền theo tuần</CardTitle>
        <p className="mt-2 text-sm text-black/60">Bảng này dùng toàn bộ DL_SO_QUY hợp lệ để thấy tuần nào tiền ra/vào bất thường.</p>
        <div className="mt-3"><ReportTable headers={['Tuần', 'Khoảng ngày', 'Số dòng', 'Tiền vào', 'Tiền ra', 'Dòng tiền thuần', 'Trạng thái']} rows={report.cashflowWeeklyRows} maxHeight="max-h-[320px]" /></div>
      </Card>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Chi theo nhóm từ sổ quỹ</CardTitle>
          <p className="mt-2 text-sm text-black/60">Tự bóc tách từ Nhóm thu/chi và Diễn giải. Nhóm trả NCC/capex/khác chưa được đưa thẳng vào P&L.</p>
          <div className="mt-3"><ReportTable headers={['Nguồn', 'Nhóm chi', 'Số tiền', 'Tuần trước', 'Tỷ trọng', 'Trạng thái', 'Ghi chú']} rows={report.cashbookGroupRows.length ? report.cashbookGroupRows : [['Sổ quỹ', 'Chưa có chi phí', '—', '—', '—', 'Chưa đủ dữ liệu', 'Cần import sổ quỹ']]} /></div>
        </Card>
        <Card>
          <CardTitle>Top khoản chi lớn cần kiểm tra</CardTitle>
          <p className="mt-2 text-sm text-black/60">Lấy trực tiếp từ DL_SO_QUY. Đây là nơi phát hiện khoản chi lớn thất thường trong tuần/kỳ đang lọc.</p>
          <div className="mt-3"><ReportTable headers={['Ngày', 'Tuần', 'Chi nhánh', 'Phân loại', 'Diễn giải', 'Số tiền', 'Trạng thái', 'Cách xử lý']} rows={report.cashbookLargeExpenseRows.length ? report.cashbookLargeExpenseRows : [['—', '—', '—', '—', 'Chưa phát hiện khoản chi lớn', '—', hasCashbook ? 'Tốt' : 'Chưa đủ dữ liệu', 'Theo dõi tiếp']]} maxHeight="max-h-[420px]" /></div>
        </Card>
      </section>
    </div>
  );
}
