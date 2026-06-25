import { PageHeader } from "@/components/layout/PageHeader";
import { BatchUploadMock } from "@/components/forms/BatchUploadMock";
import { MetricCard } from "@/components/report/MetricCard";
import { ReportTable } from "@/components/report/ReportTable";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buildDashboardReport } from "@/lib/reports/report-aggregator";
import { resolvePageSearchParams, type PageSearchParams } from "@/lib/reports/page-search-params";
import { getDataStore } from "@/lib/data-store";
import { SHEET_NAMES } from "@/lib/google-sheets/sheet-names";

export const dynamic = "force-dynamic";

async function readHistory() {
  try {
    return await getDataStore().read(SHEET_NAMES.IMPORT_LICH_SU);
  } catch {
    return [];
  }
}

export default async function BanLamViecKeToanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const history = await readHistory();
  const taskRows = report.accountingWorkbenchTaskRows.length ? report.accountingWorkbenchTaskRows : [["Cảnh báo", "Chưa có task động", "Tổng hợp 21 sheet", "Chưa đủ dữ liệu", "Kế toán", "Hôm nay", "Không", "Import dữ liệu thật"]];
  const canClose = !report.dataQuality.missingRequiredSources.length && !taskRows.some((row) => ["Nguy hiểm", "Cảnh báo"].includes(row[0]));
  const historyRows = history.slice(-8).reverse().map((row) => [String(row["Ngày import"] ?? ""), String(row["Người import"] ?? ""), String(row["Trạng thái"] ?? ""), String(row["Ghi chú"] ?? "")]);

  return (
    <div className="space-y-2.5">
      <PageHeader title="Bàn làm việc kế toán" description="Việc cần xử lý, upload file và kiểm tra độ đủ dữ liệu trước khi chốt CEO." status={report.dataQuality.status} />
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Data Quality" value={`${report.dataQuality.score}/100`} status={report.dataQuality.status === "Tốt" ? "good" : report.dataQuality.status === "Nguy hiểm" ? "danger" : "warning"} trend={report.dataQuality.message} compact />
        <MetricCard label="Nguồn còn thiếu" value={`${report.dataQuality.missingRequiredSources.length}`} status={report.dataQuality.missingRequiredSources.length ? "warning" : "good"} trend={report.dataQuality.missingRequiredSources.length ? "Cần bổ sung" : "Đủ nguồn"} compact />
        <MetricCard label="Lịch sử import" value={`${history.length}`} status={history.length ? "good" : "neutral"} trend="Lần ghi nhận" compact />
        <MetricCard label="Task đang mở" value={`${taskRows.length}`} status={taskRows.some((row) => row[0] === "Nguy hiểm") ? "danger" : taskRows.some((row) => row[0] === "Cảnh báo") ? "warning" : "good"} trend="Cần xử lý" compact />
      </section>

      <section className="grid gap-2.5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardTitle>Việc kế toán cần xử lý hôm nay</CardTitle>
          <div className="mt-2"><ReportTable headers={["Mức độ", "Việc cần làm", "Nguồn", "Bằng chứng", "Owner", "Deadline", "CEO duyệt", "Hành động"]} rows={taskRows} maxHeight="max-h-[360px]" /></div>
        </Card>
        <Card>
          <CardTitle>Chốt báo cáo</CardTitle>
          <div className="mt-2 space-y-2 text-xs leading-5 text-black/65 md:text-sm">
            <p>{canClose ? "Có thể chốt sau khi kiểm tra lần cuối." : `Chưa thể chốt: còn ${report.dataQuality.missingRequiredSources.length} nguồn thiếu hoặc task cảnh báo.`}</p>
            <div className="flex flex-wrap gap-2 pt-1"><Button disabled={!canClose}>Chốt báo cáo</Button><Button variant="secondary" disabled={!canClose}>Gửi CEO</Button><Button variant="secondary" disabled={!canClose}>Gửi Bot</Button></div>
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>Upload và kiểm tra batch nhiều file</CardTitle>
        <div className="mt-2"><BatchUploadMock /></div>
      </Card>

      <section className="grid gap-2.5 xl:grid-cols-2">
        <Card>
          <CardTitle>Độ đủ dữ liệu theo nguồn</CardTitle>
          <div className="mt-2"><ReportTable headers={["Sheet", "Nguồn", "Dòng hợp lệ", "Trạng thái", "Ảnh hưởng", "Hành động"]} rows={report.dataQualitySourceRows} maxHeight="max-h-[320px]" /></div>
        </Card>
        <Card>
          <CardTitle>Lịch sử thao tác gần nhất</CardTitle>
          <div className="mt-2"><ReportTable headers={["Thời gian", "Người xử lý", "Trạng thái", "Ghi chú"]} rows={historyRows.length ? historyRows : [["—", "—", "Chưa đủ dữ liệu", "Chưa có lịch sử import thật"]]} maxHeight="max-h-[320px]" /></div>
        </Card>
      </section>
    </div>
  );
}
