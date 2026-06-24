import { PageHeader } from "@/components/layout/PageHeader";
import { AiAgentPanel } from "@/components/dashboard/AiAgentPanel";
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

export default async function TongQuanPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  const report = await buildDashboardReport(
    await resolvePageSearchParams(searchParams),
  );
  const status = report.hasRealData
    ? report.missingSources.length
      ? "Cần đối chiếu"
      : "Tốt"
    : "Chưa đủ dữ liệu";

  return (
    <div className="space-y-4">
      <PageHeader
        title="CEO Dashboard"
        description="Màn hình CEO xem nhanh dữ liệu thật từ Google Sheet: tuần này tốt/xấu, tiền về chưa, lời/lỗ tạm tính, thất thoát và hành động tiếp theo."
        status={status}
      />

      {!report.hasRealData ? (
        <EmptyState
          title="Chưa đủ dữ liệu để kết luận"
          description="Google Sheet chưa có dữ liệu import thật. Hãy vào Nhập liệu & Import, kiểm tra batch, sau đó xác nhận Import file đạt."
        />
      ) : null}

      <section className="rounded-2xl border-l-8 border-amber-500 bg-white p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Executive Status · {report.dataMode}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-lang-brown">
          {report.hasRealData
            ? "Đã có dữ liệu import thật"
            : "Chưa đủ dữ liệu để kết luận."}
        </h3>
        <p className="mt-2 text-sm text-black/60">{report.message}</p>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
              Bộ lọc dữ liệu thật
            </p>
            <h3 className="mt-1 text-lg font-bold text-lang-brown">
              {report.filterMetadata.activeFilterCount
                ? `${report.filterMetadata.activeFilterCount} điều kiện đang áp dụng`
                : "Đang xem toàn bộ dữ liệu"}
            </h3>
            <p className="mt-1 text-sm text-black/60">
              {report.filterMetadata.filterSummary.length
                ? report.filterMetadata.filterSummary.join(" • ")
                : "Chưa chọn kỳ/chi nhánh/kênh cụ thể. Báo cáo đang đọc toàn bộ dòng hợp lệ."}
            </p>
          </div>
          <div className="rounded-xl bg-lang-cream px-3 py-2 text-xs font-bold text-lang-brown">
            Không dùng lựa chọn hard-code
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-xs text-black/60 md:grid-cols-2 xl:grid-cols-4">
          {report.filterMetadata.evidence.slice(0, 8).map((item) => (
            <div key={item} className="rounded-lg bg-lang-cream px-3 py-2">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {report.executiveKpis.map((kpi) => (
          <MetricCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            trend={kpi.trend}
            status={kpi.status}
          />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard
          title="Doanh thu theo nguồn thật"
          description="Không dùng số mẫu. Chỉ hiện khi Google Sheet có dữ liệu import."
          items={report.revenueByChannel.map((item) => ({
            label: item.channel,
            value: item.value,
            caption: item.revenue,
          }))}
        />
        <ChartCard
          title="Chất lượng dữ liệu"
          description="Số dòng đã ghi vào các sheet dữ liệu gốc."
          items={[
            {
              label: "Doanh thu app",
              value: report.sourceCounts.appRevenue,
              caption: `${report.sourceCounts.appRevenue} dòng`,
            },
            {
              label: "Doanh thu cửa hàng",
              value: report.sourceCounts.storeRevenue,
              caption: `${report.sourceCounts.storeRevenue} dòng`,
            },
            {
              label: "Sổ quỹ",
              value: report.sourceCounts.cashbook,
              caption: `${report.sourceCounts.cashbook} dòng`,
            },
            {
              label: "Tồn kho",
              value: report.sourceCounts.inventory,
              caption: `${report.sourceCounts.inventory} dòng`,
            },
            {
              label: "Thất thoát",
              value: report.sourceCounts.lossRows,
              caption: `${report.sourceCounts.lossRows} dòng`,
            },
          ]}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Data Quality Summary</CardTitle>
          <p className="mt-2 text-sm text-black/60">
            Score và trạng thái import/lỗi/trùng/lệch trước khi CEO chốt báo
            cáo.
          </p>
          <div className="mt-3">
            <ReportTable
              headers={["Chỉ số", "Giá trị", "Trạng thái", "Ghi chú"]}
              rows={report.dataQualitySummaryRows}
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Top việc kế toán cần xử lý</CardTitle>
          <p className="mt-2 text-sm text-black/60">
            Sinh tự động từ Data Quality Agent và Cashbook Intelligence, không
            dùng Gemini để quyết định đúng/sai dữ liệu.
          </p>
          <div className="mt-3">
            <ReportTable
              headers={[
                "Mức độ",
                "Việc cần làm",
                "Nguồn",
                "Bằng chứng",
                "Owner",
                "Deadline",
                "CEO duyệt",
                "Hành động",
              ]}
              rows={report.accountingWorkbenchTaskRows.slice(0, 6)}
              maxHeight="max-h-[420px]"
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Việc CEO cần nhìn ngay</CardTitle>
          <p className="mt-2 text-sm text-black/60">
            Ưu tiên lấy từ sổ quỹ, thiếu nguồn đối chiếu và khoản chi lớn bất
            thường.
          </p>
          <div className="mt-3">
            <ReportTable
              headers={["Ưu tiên", "Vấn đề", "Ảnh hưởng", "Hành động", "Owner"]}
              rows={report.ceoActionRows}
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Top vấn đề cần CEO chú ý</CardTitle>
          <div className="mt-3">
            <ReportTable
              headers={[
                "Hạng",
                "Vấn đề",
                "Ảnh hưởng",
                "Nguyên nhân",
                "Đề xuất xử lý",
              ]}
              rows={report.issueRows}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Data Quality Agent — 7 nguồn dữ liệu</CardTitle>
          <p className="mt-2 text-sm text-black/60">
            Nguồn nào chưa có dòng import hợp lệ sẽ không được dùng để kết luận
            số.
          </p>
          <div className="mt-3">
            <ReportTable
              headers={[
                "Sheet",
                "Nguồn",
                "Dòng hợp lệ",
                "Trạng thái",
                "Ảnh hưởng",
                "Hành động",
              ]}
              rows={report.dataQualitySourceRows}
              maxHeight="max-h-[360px]"
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Thất thoát NVL — Top 5 cần xử lý</CardTitle>
          <p className="mt-2 text-sm text-black/60">
            Không có dữ liệu thì bảng để trống, không dùng dữ liệu mẫu.
          </p>
          <div className="mt-3">
            <ReportTable
              headers={[
                "NVL",
                "ĐVT",
                "Chênh SL",
                "Giá trị lệch",
                "Tỷ lệ",
                "Định mức",
                "Vượt",
                "Trạng thái",
                "Hành động",
              ]}
              rows={report.lossTop5Rows}
              maxHeight="max-h-[340px]"
            />
          </div>
        </Card>
      </section>

      <AiAgentPanel report={report} />
    </div>
  );
}
