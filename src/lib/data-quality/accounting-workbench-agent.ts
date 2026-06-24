import { SHEET_NAMES } from "@/lib/google-sheets/sheet-names";
import type { CashbookAnalysis } from "@/lib/reports/cashbook-analysis";
import type { SourceCounts } from "@/lib/reports/report-aggregator";
import type {
  AccountingWorkbenchTask,
  DataQualityReport,
  DataQualitySeverity,
} from "./data-quality-types";

function severityFromCashbook(value: string): DataQualitySeverity {
  if (value.includes("Nguy hiểm")) return "Nguy hiểm";
  if (value.includes("CEO") || value.includes("Cảnh báo")) return "Cảnh báo";
  if (value.includes("Cần")) return "Cần kiểm tra";
  return "Cần kiểm tra";
}

function parseCashbookTask(
  row: string[],
  index: number,
): AccountingWorkbenchTask {
  const severity = severityFromCashbook(row[0] ?? "Cần kiểm tra");
  const task = row[1] ?? "Kiểm tra sổ quỹ";
  const evidence = row[4] ?? "Từ phân tích sổ quỹ";
  const needsCeoApproval =
    row[0]?.includes("CEO") ||
    task.toLowerCase().includes("capex") ||
    task.toLowerCase().includes("đầu tư");
  return {
    id: `CB-${String(index + 1).padStart(3, "0")}`,
    type: needsCeoApproval
      ? "ceo_approval"
      : task.includes("Đối chiếu")
        ? "cross_check"
        : "cashbook_classification",
    severity,
    task,
    source: SHEET_NAMES.DL_SO_QUY,
    evidence,
    owner: needsCeoApproval ? "CEO/Kế toán" : "Kế toán",
    deadline: row[3] ?? "Hôm nay",
    action: evidence,
    needsCeoApproval,
  };
}

function closingTask(
  dataQuality: DataQualityReport,
  sourceCounts: SourceCounts,
): AccountingWorkbenchTask {
  const missing = dataQuality.missingRequiredSources;
  const hasBlockingTask = dataQuality.tasks.some(
    (task) => task.severity === "Nguy hiểm" || task.needsCeoApproval,
  );
  const canClose =
    missing.length === 0 && !hasBlockingTask && sourceCounts.cashbook > 0;

  return {
    id: "CLOSE-001",
    type: "close_report",
    severity: canClose ? "Tốt" : "Cảnh báo",
    task: canClose
      ? "Có thể chốt nháp báo cáo CEO"
      : "Chưa thể chốt báo cáo CEO",
    source: "Tổng hợp 21 sheet",
    evidence: canClose
      ? "Nguồn bắt buộc đã có dữ liệu hợp lệ và không có task chặn."
      : `Còn ${missing.length} nguồn bắt buộc thiếu hoặc còn việc cần duyệt/xử lý.`,
    owner: canClose ? "Kế toán" : "CEO/Kế toán",
    deadline: canClose ? "Sau rà soát cuối" : "Hôm nay",
    action: canClose
      ? "Kế toán kiểm tra lần cuối rồi gửi CEO duyệt."
      : "Hoàn tất task dữ liệu/công nợ/capex trước khi chốt.",
    needsCeoApproval: !canClose,
  };
}

export function buildAccountingWorkbenchTasks(input: {
  dataQuality: DataQualityReport;
  cashbookAnalysis: CashbookAnalysis;
  sourceCounts: SourceCounts;
}): AccountingWorkbenchTask[] {
  const cashbookTasks = input.cashbookAnalysis.accountingTaskRows
    .filter((row) => row[0] !== "Tốt")
    .map(parseCashbookTask);

  const tasks = [
    ...input.dataQuality.tasks,
    ...cashbookTasks,
    closingTask(input.dataQuality, input.sourceCounts),
  ];

  const unique = new Map<string, AccountingWorkbenchTask>();
  for (const task of tasks) {
    const key = `${task.type}|${task.task}|${task.source}`;
    if (!unique.has(key)) unique.set(key, task);
  }

  return Array.from(unique.values()).sort((a, b) => {
    const rank = {
      "Nguy hiểm": 0,
      "Cảnh báo": 1,
      "Cần kiểm tra": 2,
      Tốt: 3,
    } as const;
    return rank[a.severity] - rank[b.severity];
  });
}

export function tasksToRows(tasks: AccountingWorkbenchTask[]) {
  return tasks.map((task) => [
    task.severity,
    task.task,
    task.source,
    task.evidence,
    task.owner,
    task.deadline,
    task.needsCeoApproval ? "Có" : "Không",
    task.action,
  ]);
}
