import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/report/ChartCard";
import { MetricCard } from "@/components/report/MetricCard";
import { ReportTable } from "@/components/report/ReportTable";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildDashboardReport } from "@/lib/reports/report-aggregator";
import { resolvePageSearchParams, type PageSearchParams } from "@/lib/reports/page-search-params";

export const dynamic = "force-dynamic";

const kpiCopy: Record<string, string> = {
  "Tổng doanh thu": "Cửa hàng + App",
  "Doanh thu cửa hàng": "Offline + MoMo",
  "Doanh thu app net": "Kênh app",
  "Tiền vào": "Đã ghi nhận thu",
  "Tiền ra": "Đã ghi nhận chi",
  "Dòng tiền tạm": "Thu - chi",
  "Chi cần phân loại": "Kế toán rà",
  "Tồn kho": "Theo tồn kho",
  "Thất thoát quy tiền": "Theo NVL",
};

export default async function TongQuanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const status = report.hasRealData ? (report.missingSources.length ? "Cần đối chiếu" : "Tốt") : "Chưa đủ dữ liệu";
  const mainKpis = report.executiveKpis.filter((kpi) => Object.keys(kpiCopy).includes(kpi.label));

  return (
    <div className="space-y-2.5">
      <PageHeader title="Tổng quan kế toán" description="Rà nhanh dữ liệu, tiền, kho, thất thoát và việc cần xử lý." status={status} />

      {!report.hasRealData ? <EmptyState title="Chưa đủ dữ liệu để kết luận" description="Import và xác nhận dữ liệu trước khi chốt báo cáo." /> : null}

      {report.missingSources.length ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          Còn {report.missingSources.length} nguồn cần bổ sung: {report.missingSources.join(", ")}.
        </section>
      ) : null}

      <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {mainKpis.map((kpi) => (
          <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpiCopy[kpi.label] ?? kpi.hint} trend={kpi.trend} status={kpi.status} compact />
        ))}
      </section>

      <section className="grid gap-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ChartCard title="Doanh thu theo nguồn" items={report.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue }))} />
        <Card>
          <CardTitle>Việc kế toán cần xử lý</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Ưu tiên", "Vấn đề", "Ảnh hưởng", "Hành động", "Owner"]} rows={report.ceoActionRows} maxHeight="max-h-[260px]" />
          </div>
        </Card>
      </section>

      <section className="grid gap-2 xl:grid-cols-2">
        <Card>
          <CardTitle>Chi theo đơn vị chịu chi</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Đơn vị", "Bản chất chi", "Số tiền", "Xử lý kế toán", "Tỷ trọng", "Trạng thái", "Hành động"]} rows={report.cashbookGroupRows} maxHeight="max-h-[300px]" />
          </div>
        </Card>
        <Card>
          <CardTitle>Top vấn đề cần rà trước khi chốt</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Hạng", "Vấn đề", "Ảnh hưởng", "Nguyên nhân", "Đề xuất xử lý"]} rows={report.issueRows} maxHeight="max-h-[300px]" />
          </div>
        </Card>
      </section>

      <section className="grid gap-2 xl:grid-cols-2">
        <Card>
          <CardTitle>Thất thoát NVL — cần giải trình</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["NVL", "ĐVT", "Chênh SL", "Giá trị lệch", "Tỷ lệ", "Trạng thái", "Hành động"]} rows={report.lossTop5Rows.map((row) => [row[0], row[1], row[2], row[3], row[4], row[7], row[8]])} maxHeight="max-h-[300px]" />
          </div>
        </Card>
        <Card>
          <CardTitle>Độ sẵn sàng nguồn dữ liệu</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Sheet", "Vai trò", "Dòng", "Trạng thái", "Ảnh hưởng"]} rows={report.sourceReadinessRows} maxHeight="max-h-[300px]" />
          </div>
        </Card>
      </section>
    </div>
  );
}
