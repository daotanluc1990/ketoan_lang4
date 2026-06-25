import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/report/ChartCard";
import { MetricCard } from "@/components/report/MetricCard";
import { ReportTable } from "@/components/report/ReportTable";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildDashboardReport } from "@/lib/reports/report-aggregator";
import {
  resolvePageSearchParams,
  type PageSearchParams,
} from "@/lib/reports/page-search-params";

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
      <PageHeader title="CEO Dashboard" description="Xem nhanh doanh thu, dòng tiền, tồn kho, thất thoát và việc cần xử lý." status={status} />

      {!report.hasRealData ? <EmptyState title="Chưa đủ dữ liệu để kết luận" description="Hãy import và xác nhận dữ liệu trước khi chốt báo cáo." /> : null}

      {report.missingSources.length ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 md:text-sm">
          Thiếu {report.missingSources.length} nguồn: {report.missingSources.join(", ")}.
        </section>
      ) : null}

      <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {mainKpis.map((kpi) => (
          <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpiCopy[kpi.label]} status={kpi.status} compact />
        ))}
      </section>

      <section className="grid gap-2.5 xl:grid-cols-2">
        <ChartCard title="Doanh thu theo nguồn" items={report.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue }))} />
        <Card>
          <CardTitle>Việc cần xử lý ngay</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Ưu tiên", "Vấn đề", "Ảnh hưởng", "Hành động", "Owner"]} rows={report.ceoActionRows.slice(0, 5)} maxHeight="max-h-[220px]" />
          </div>
        </Card>
      </section>

      <section className="grid gap-2.5 xl:grid-cols-2">
        <Card>
          <CardTitle>Top vấn đề cần CEO chú ý</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Hạng", "Vấn đề", "Ảnh hưởng", "Nguyên nhân", "Đề xuất xử lý"]} rows={report.issueRows.slice(0, 5)} maxHeight="max-h-[220px]" />
          </div>
        </Card>
        <Card>
          <CardTitle>Thất thoát NVL — Top 5</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["NVL", "ĐVT", "Chênh SL", "Giá trị", "Tỷ lệ", "Trạng thái", "Hành động"]} rows={report.lossTop5Rows.map((row) => [row[0], row[1], row[2], row[3], row[4], row[7], row[8]])} maxHeight="max-h-[220px]" />
          </div>
        </Card>
      </section>
    </div>
  );
}
