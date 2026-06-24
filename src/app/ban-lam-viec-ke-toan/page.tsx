import { PageHeader } from "@/components/layout/PageHeader";
import { BatchUploadMock } from "@/components/forms/BatchUploadMock";
import { ReportStatusPanel } from "@/components/report/ReportStatusPanel";
import { MetricCard } from "@/components/report/MetricCard";
import { ReportTable } from "@/components/report/ReportTable";
import { PermissionMatrix } from "@/components/report/PermissionMatrix";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buildDashboardReport } from "@/lib/reports/report-aggregator";
import {
  resolvePageSearchParams,
  type PageSearchParams,
} from "@/lib/reports/page-search-params";
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
  const report = await buildDashboardReport(
    await resolvePageSearchParams(searchParams),
  );
  const history = await readHistory();
  const checklistRows = report.dataQualitySourceRows;
  const taskRows = report.accountingWorkbenchTaskRows.length
    ? report.accountingWorkbenchTaskRows
    : [
        [
          "Cảnh báo",
          "Chưa có task động",
          "Tổng hợp 21 sheet",
          "Chưa đủ dữ liệu để kết luận",
          "Kế toán",
          "Hôm nay",
          "Không",
          "Import dữ liệu thật và kiểm tra lại",
        ],
      ];
  const canClose =
    !report.dataQuality.missingRequiredSources.length &&
    !taskRows.some((row) => ["Nguy hiểm", "Cảnh báo"].includes(row[0]));
  const historyRows = history
    .slice(-10)
    .reverse()
    .map((row) => [
      String(row["Ngày import"] ?? ""),
      String(row["Người import"] ?? ""),
      String(row["Trạng thái"] ?? ""),
      String(row["Ghi chú"] ?? ""),
    ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bàn làm việc kế toán"
        description="Agent rule-based tự kiểm 21 sheet, phát hiện thiếu/lỗi/trùng/lệch và sinh việc kế toán trước khi chốt CEO."
        status={report.dataQuality.status}
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Data Quality Score"
          value={`${report.dataQuality.score}/100`}
          status={
            report.dataQuality.status === "Tốt"
              ? "good"
              : report.dataQuality.status === "Nguy hiểm"
                ? "danger"
                : "warning"
          }
          trend={report.dataQuality.message}
        />
        <MetricCard
          label="Nguồn bắt buộc còn thiếu"
          value={`${report.dataQuality.missingRequiredSources.length}`}
          status={
            report.dataQuality.missingRequiredSources.length
              ? "warning"
              : "good"
          }
          trend={
            report.dataQuality.missingRequiredSources.length
              ? report.dataQuality.missingRequiredSources.join(", ")
              : "Đủ nguồn bắt buộc"
          }
        />
        <MetricCard
          label="Lịch sử import"
          value={`${history.length}`}
          status={history.length ? "good" : "neutral"}
          trend="IMPORT_LICH_SU"
        />
        <MetricCard
          label="Task đang mở"
          value={`${taskRows.length}`}
          status={
            taskRows.some((row) => row[0] === "Nguy hiểm")
              ? "danger"
              : taskRows.some((row) => row[0] === "Cảnh báo")
                ? "warning"
                : "good"
          }
          trend="Sinh tự động từ Data Quality Agent"
        />
      </section>
      <ReportStatusPanel />
      <Card>
        <CardTitle>Checklist báo cáo thứ 2 · Độ đủ dữ liệu 7 nguồn</CardTitle>
        <p className="mt-2 text-sm text-black/60">
          Checklist động theo dòng import hợp lệ, không dùng dữ liệu mẫu.
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
            rows={checklistRows}
            maxHeight="max-h-[420px]"
          />
        </div>
      </Card>
      <Card>
        <CardTitle>Upload và kiểm tra batch nhiều file</CardTitle>
        <p className="mt-2 text-sm text-black/60">
          Có thể chọn 4–5 file cùng lúc. Upload chỉ là bước kiểm tra; chỉ bấm
          Import file đạt khi lỗi/lệch bằng 0.
        </p>
        <div className="mt-3">
          <BatchUploadMock />
        </div>
      </Card>
      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Việc kế toán cần xử lý hôm nay</CardTitle>
          <p className="mt-2 text-sm text-black/60">
            Sinh tự động từ Data Quality Agent + Cashbook Intelligence. Gemini
            không được dùng để quyết định đúng/sai dữ liệu.
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
              rows={taskRows}
              maxHeight="max-h-[520px]"
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Chốt báo cáo & gửi CEO/Bot</CardTitle>
          <p className="mt-2 text-sm text-black/60">
            Production strict: chỉ chốt khi đủ nguồn dữ liệu chính, không dùng
            số mẫu. Khoản trả NCC/capex/nhóm Khác từ sổ quỹ phải được phân loại
            trước khi chốt P&L.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button disabled={!canClose}>Chốt báo cáo tuần</Button>
            <Button variant="secondary" disabled={!canClose}>
              Gửi CEO
            </Button>
            <Button variant="secondary" disabled={!canClose}>
              Gửi Bot
            </Button>
          </div>
          <p className="mt-3 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {canClose
              ? "Có thể chốt sau khi kế toán kiểm tra lần cuối."
              : `Không thể chốt: Data Quality ${report.dataQuality.status}, còn ${report.dataQuality.missingRequiredSources.length} nguồn bắt buộc thiếu hoặc task cần xử lý.`}
          </p>
        </Card>
      </section>

      <Card>
        <CardTitle>Ma trận kiểm soát 21 sheet</CardTitle>
        <p className="mt-2 text-sm text-black/60">
          Kiểm tra số dòng, dòng hợp lệ, dòng chưa hợp lệ, trạng thái và hành
          động theo từng sheet trong Data Master.
        </p>
        <div className="mt-3">
          <ReportTable
            headers={[
              "Sheet",
              "Nhóm",
              "Tổng dòng",
              "Dòng hợp lệ",
              "Dòng chưa hợp lệ",
              "Trạng thái",
              "Hành động",
            ]}
            rows={report.dataQualityMatrixRows}
            maxHeight="max-h-[520px]"
          />
        </div>
      </Card>
      <Card>
        <CardTitle>Lịch sử thao tác kế toán</CardTitle>
        <div className="mt-3">
          <ReportTable
            headers={["Thời gian", "Người xử lý", "Hành động", "Ghi chú"]}
            rows={
              historyRows.length
                ? historyRows
                : [["—", "—", "Chưa đủ dữ liệu", "Chưa có lịch sử import thật"]]
            }
          />
        </div>
      </Card>
      <PermissionMatrix />
    </div>
  );
}
