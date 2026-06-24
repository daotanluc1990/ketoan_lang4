import { Card, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/report/StatusBadge';
import { ReportTable } from '@/components/report/ReportTable';
import { buildDashboardReport, type DashboardReport } from '@/lib/reports/report-aggregator';

export async function AiAgentPanel({ report: providedReport }: { report?: DashboardReport }) {
  const report = providedReport ?? await buildDashboardReport();
  const rows = report.hasRealData
    ? report.issueRows.map((row) => [row[0] ?? '', row[1] ?? '', row[2] ?? '', row[3] ?? '', row[4] ?? ''])
    : [['Cảnh báo', 'Chưa có dữ liệu thật', 'Google Sheet chưa có dòng import hợp lệ', 'Chưa import hoặc chưa xác nhận ghi', 'Import đủ file rồi chạy AI Agent']];

  return (
    <Card className="border border-lang-yellow/50">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <CardTitle>AI Agent — Phân tích nguyên nhân & đề xuất hành động</CardTitle>
          <p className="mt-2 text-sm text-black/60">
            AI chỉ phân tích dựa trên dữ liệu thật đã đọc từ Google Sheet/data store. Nếu thiếu dữ liệu, hệ thống phải báo “Chưa đủ dữ liệu để kết luận”.
          </p>
        </div>
        <StatusBadge status={report.hasRealData ? (report.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu'} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-lang-cream p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Trạng thái AI</p>
          <p className="mt-2 font-bold text-lang-brown">{report.hasRealData ? 'Sẵn sàng phân tích' : 'Chờ dữ liệu thật'}</p>
        </div>
        <div className="rounded-xl bg-lang-cream p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Nguồn dữ liệu</p>
          <p className="mt-2 font-bold text-lang-brown">{report.dataMode}</p>
        </div>
        <div className="rounded-xl bg-lang-cream p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Dữ liệu thiếu</p>
          <p className="mt-2 font-bold text-lang-brown">{report.missingSources.length ? report.missingSources.length : 'Không'}</p>
        </div>
      </div>
      <div className="mt-3">
        <ReportTable headers={['Mức độ', 'Vấn đề', 'Bằng chứng', 'Nguyên nhân khả nghi', 'Hành động đề xuất']} rows={rows} />
      </div>
    </Card>
  );
}
