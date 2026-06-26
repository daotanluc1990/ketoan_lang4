import { PageHeader } from "@/components/layout/PageHeader";
import { BatchUploadMock } from "@/components/forms/BatchUploadMock";
import { ReportStatusPanel } from "@/components/report/ReportStatusPanel";
import { MetricCard } from "@/components/report/MetricCard";
import { ReportTable } from "@/components/report/ReportTable";
import { PermissionMatrix } from "@/components/report/PermissionMatrix";
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

export default async function BanLamViecKeToanPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const history = await readHistory();
  const checklistRows = report.dataQualitySourceRows;
  const taskRows = report.accountingWorkbenchTaskRows.length
    ? report.accountingWorkbenchTaskRows
    : [["Cảnh báo", "Chưa có task động", "Tổng hợp 21 sheet", "Chưa đủ dữ liệu", "Kế toán", "Hôm nay", "Không", "Import dữ liệu thật"]];
  const canClose =
    !report.dataQuality.missingRequiredSources.length &&
    !taskRows.some((row) => ["Nguy hiểm", "Cảnh báo"].includes(row[0]));
  const historyRows = history
    .slice(-12)
    .reverse()
    .map((row) => [
      String(row["Ngày import"] ?? ""),
      String(row["Người import"] ?? ""),
      String(row["Trạng thái"] ?? ""),
      String(row["Ghi chú"] ?? ""),
    ]);

  return (
    <div className="space-y-2.5">
      <PageHeader title="Bàn làm việc kế toán" description="Kiểm tra dữ liệu, task và chốt báo cáo." status={report.dataQuality.status} />

      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact label="Data Quality" value={`${report.dataQuality.score}/100`} status={report.dataQuality.status === "Tốt" ? "good" : report.dataQuality.status === "Nguy hiểm" ? "danger" : "warning"} trend={report.dataQuality.message} />
        <MetricCard compact label="Nguồn còn thiếu" value={`${report.dataQuality.missingRequiredSources.length}`} status={report.dataQuality.missingRequiredSources.length ? "warning" : "good"} trend={report.dataQuality.missingRequiredSources.length ? report.dataQuality.missingRequiredSources.join(", ") : "Đủ nguồn"} />
        <MetricCard compact label="Lịch sử import" value={`${history.length}`} status={history.length ? "good" : "neutral"} trend="IMPORT_LICH_SU" />
        <MetricCard compact label="Task mở" value={`${taskRows.length}`} status={taskRows.some((row) => row[0] === "Nguy hiểm") ? "danger" : taskRows.some((row) => row[0] === "Cảnh báo") ? "warning" : "good"} trend="Việc cần xử lý" />
      </section>

      <ReportStatusPanel />

      <section className="grid gap-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardTitle>Checklist nguồn dữ liệu</CardTitle>
          <div className="mt-2">
            <ReportTable
              headers={["Sheet", "Nguồn", "Dòng hợp lệ", "Trạng thái", "Ảnh hưởng", "Hành động"]}
              rows={checklistRows}
              maxHeight="max-h-[300px]"
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Chốt báo cáo & gửi Bot</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button disabled={!canClose}>Chốt báo cáo tuần</Button>
            <Button variant="secondary" disabled={!canClose}>Gửi CEO</Button>
            <Button variant="secondary" disabled={!canClose}>Gửi Bot</Button>
          </div>
          <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-black ${canClose ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {canClose ? "Có thể chốt sau khi kế toán rà lần cuối." : `Không thể chốt: còn ${report.dataQuality.missingRequiredSources.length} nguồn thiếu hoặc task cần xử lý.`}
          </p>
        </Card>
      </section>

      <Card>
        <CardTitle>Upload và kiểm tra batch nhiều file</CardTitle>
        <div className="mt-2">
          <BatchUploadMock />
        </div>
      </Card>

      <section className="grid gap-2 xl:grid-cols-2">
        <Card>
          <CardTitle>Việc kế toán cần xử lý hôm nay</CardTitle>
          <div className="mt-2">
            <ReportTable
              headers={["Mức độ", "Việc cần làm", "Nguồn", "Bằng chứng", "Owner", "Deadline", "CEO duyệt", "Hành động"]}
              rows={taskRows}
              maxHeight="max-h-[360px]"
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Lịch sử thao tác kế toán</CardTitle>
          <div className="mt-2">
            <ReportTable
              headers={["Thời gian", "Người xử lý", "Hành động", "Ghi chú"]}
              rows={historyRows.length ? historyRows : [["—", "—", "Chưa đủ dữ liệu", "Chưa có lịch sử import thật"]]}
              maxHeight="max-h-[360px]"
            />
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>Ma trận kiểm soát Data Master</CardTitle>
        <div className="mt-2">
          <ReportTable
            headers={["Sheet", "Nhóm", "Tổng dòng", "Dòng hợp lệ", "Dòng chưa hợp lệ", "Trạng thái", "Hành động"]}
            rows={report.dataQualityMatrixRows}
            maxHeight="max-h-[360px]"
          />
        </div>
      </Card>

      <PermissionMatrix />
    </div>
  );
}
