import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/report/MetricCard";
import { ReportTable } from "@/components/report/ReportTable";
import { PermissionMatrix } from "@/components/report/PermissionMatrix";
import { AccountingCostCenterPanel } from "@/components/report/AccountingCostCenterPanel";
import { RefreshReportCacheButton } from "@/components/report/RefreshReportCacheButton";
import { Card, CardTitle } from "@/components/ui/Card";
import { buildSnapshotWorkbenchReport } from "@/lib/reports/cached-fast-page-reports";
import { resolvePageSearchParams, type PageSearchParams } from "@/lib/reports/page-search-params";

export const revalidate = 300;

export default async function BanLamViecKeToanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotWorkbenchReport(await resolvePageSearchParams(searchParams));
  const checklistRows = report.dataQualitySourceRows;
  const taskRows = report.accountingWorkbenchTaskRows.length ? report.accountingWorkbenchTaskRows : [["Tốt", "Không có việc mở", "Nguồn chính", "Không có cảnh báo lớn", "Kế toán", "Theo dõi", "Không", "Rà lần cuối"]];

  return (
    <div className="space-y-2.5">
      <PageHeader title="Bàn làm việc kế toán" description="Kiểm tra dữ liệu và việc cần xử lý." status={report.dataQuality.status} />
      <Card><CardTitle>Làm mới cache báo cáo</CardTitle><div className="mt-2"><RefreshReportCacheButton /></div></Card>
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact label="Data Quality" value={`${report.dataQuality.score}/100`} status={report.dataQuality.status === "Tốt" ? "good" : "warning"} trend={report.dataQuality.message} />
        <MetricCard compact label="Nguồn còn thiếu" value={`${report.dataQuality.missingRequiredSources.length}`} status={report.dataQuality.missingRequiredSources.length ? "warning" : "good"} trend={report.dataQuality.missingRequiredSources.length ? report.dataQuality.missingRequiredSources.join(", ") : "Đủ nguồn"} />
        <MetricCard compact label="Task mở" value={`${taskRows.length}`} status={taskRows.some((row) => row[0] === "Cảnh báo") ? "warning" : "good"} trend="Việc cần xử lý" />
        <MetricCard compact label="Cache" value="Snapshot" status="good" trend="Đọc nhanh" />
      </section>
      <section className="grid gap-2 xl:grid-cols-2">
        <Card><CardTitle>Checklist nguồn dữ liệu</CardTitle><div className="mt-2"><ReportTable headers={["Sheet", "Nguồn", "Dòng hợp lệ", "Trạng thái", "Ảnh hưởng", "Hành động"]} rows={checklistRows} maxHeight="max-h-[300px]" /></div></Card>
        <Card><CardTitle>Việc cần xử lý</CardTitle><div className="mt-2"><ReportTable headers={["Mức độ", "Việc cần làm", "Nguồn", "Bằng chứng", "Owner", "Deadline", "Duyệt", "Hành động"]} rows={taskRows} maxHeight="max-h-[300px]" /></div></Card>
      </section>
      <section className="grid gap-2 xl:grid-cols-2">
        <AccountingCostCenterPanel rows={report.cashbookGroupRows} />
        <Card><CardTitle>Ma trận nguồn chính</CardTitle><div className="mt-2"><ReportTable headers={["Sheet", "Nguồn", "Dòng hợp lệ", "Trạng thái", "Ảnh hưởng", "Hành động"]} rows={report.dataQualityMatrixRows} maxHeight="max-h-[300px]" /></div></Card>
      </section>
      <PermissionMatrix />
    </div>
  );
}
