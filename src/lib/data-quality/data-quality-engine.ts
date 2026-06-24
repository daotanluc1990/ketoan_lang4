import { GOOGLE_SHEETS_SCHEMA } from "@/lib/google-sheets/schema";
import { SHEET_NAMES } from "@/lib/google-sheets/sheet-names";
import {
  isValidImportRow,
  type ReportFilter,
} from "@/lib/reports/report-filters";
import {
  normalizeText,
  pickText,
  toText,
  type DataRow,
} from "@/lib/reports/row-normalizers";
import {
  SOURCE_CONTRACTS,
  SOURCE_KEYS,
  type SourceKey,
} from "@/lib/reports/source-contract";
import {
  DATA_QUALITY_THRESHOLDS,
  REQUIRED_FOR_FULL_CEO_REPORT,
  REQUIRED_FOR_WEEKLY_CLOSE,
  SOURCE_ACTION,
  SOURCE_BUSINESS_IMPACT,
} from "./rules";
import type {
  AccountingWorkbenchTask,
  DataQualityReport,
  DataQualitySeverity,
  ImportControlStatus,
  SheetQualityStatus,
  SourceQualityStatus,
} from "./data-quality-types";

const SOURCE_SHEET_NAMES = new Set(
  SOURCE_KEYS.map((key) => SOURCE_CONTRACTS[key].sheetName),
);
const REPORT_SHEETS = new Set<string>([
  SHEET_NAMES.CEO_DASHBOARD,
  SHEET_NAMES.PL_TUAN,
  SHEET_NAMES.DONG_TIEN_TUAN,
  SHEET_NAMES.CAN_DOI_RUT_GON,
  SHEET_NAMES.DU_TOAN_TUAN_TOI,
  SHEET_NAMES.THAT_THOAT_CHI_TIET,
  SHEET_NAMES.BAN_LAM_VIEC_KE_TOAN,
]);
const CONTROL_SHEETS = new Set<string>([
  SHEET_NAMES.IMPORT_LICH_SU,
  SHEET_NAMES.IMPORT_DONG_LOI,
  SHEET_NAMES.IMPORT_DU_LIEU_TRUNG,
  SHEET_NAMES.IMPORT_DU_LIEU_LECH,
  SHEET_NAMES.AUDIT_LOG,
]);

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toLocaleString("vi-VN") : "0";
}

function severityRank(severity: DataQualitySeverity) {
  return { Tốt: 0, "Cần kiểm tra": 1, "Cảnh báo": 2, "Nguy hiểm": 3 }[severity];
}

function sheetGroup(sheetName: string): SheetQualityStatus["group"] {
  if (SOURCE_SHEET_NAMES.has(sheetName)) return "Nguồn dữ liệu";
  if (REPORT_SHEETS.has(sheetName)) return "Báo cáo/Công việc";
  if (CONTROL_SHEETS.has(sheetName)) return "Import/Audit";
  return "Cấu hình";
}

function existingColumns(rows: DataRow[]) {
  const columns = new Set<string>();
  for (const row of rows.slice(0, 20)) {
    for (const [key, value] of Object.entries(row)) {
      if (key && toText(value)) columns.add(key);
    }
  }
  return columns;
}

function missingColumnsForRows(rows: DataRow[], expectedColumns: string[]) {
  if (!rows.length) return [];
  const columns = existingColumns(rows);
  return expectedColumns.filter((column) => !columns.has(column));
}

function requiredContractColumns(key: SourceKey) {
  const contract = SOURCE_CONTRACTS[key];
  return Array.from(
    new Set(
      [
        "Mã dòng dữ liệu",
        "Mã lần import",
        ...contract.dateColumns,
        ...contract.weekColumns,
        ...contract.branchColumns,
        ...contract.statusColumns,
        ...contract.channelColumns,
        ...contract.alertStatusColumns,
        ...contract.importedByColumns,
        "Trạng thái dữ liệu",
      ].filter(Boolean),
    ),
  );
}

function sourceKeyBySheetName(sheetName: string) {
  return SOURCE_KEYS.find(
    (key) => SOURCE_CONTRACTS[key].sheetName === sheetName,
  );
}

function buildSheetStatus(
  sheetName: string,
  rows: DataRow[],
  description: string,
  columns: string[],
): SheetQualityStatus {
  const key = sourceKeyBySheetName(sheetName);
  const validRows = key ? rows.filter(isValidImportRow).length : rows.length;
  const invalidRows = key ? Math.max(0, rows.length - validRows) : 0;
  const missingColumns = key
    ? missingColumnsForRows(rows, requiredContractColumns(key))
    : missingColumnsForRows(rows, columns.slice(0, 4));
  let severity: DataQualitySeverity = "Tốt";
  let status = rows.length ? "Có dữ liệu" : "Chưa có dữ liệu";
  let action = rows.length
    ? "Theo dõi"
    : "Chưa cần xử lý nếu đây là sheet báo cáo/cấu hình";

  if (key) {
    if (!validRows) {
      severity = REQUIRED_FOR_FULL_CEO_REPORT.includes(key)
        ? "Cảnh báo"
        : "Cần kiểm tra";
      status = "Chưa có dòng hợp lệ";
      action = SOURCE_ACTION[key];
    } else if (invalidRows >= DATA_QUALITY_THRESHOLDS.invalidRowWarning) {
      severity = "Cần kiểm tra";
      status = "Có dòng chưa hợp lệ";
      action =
        "Kiểm tra dòng mẫu/chưa xác nhận; app chỉ dùng dòng IMP- và Đã xác nhận";
    }
  }

  if (missingColumns.length) {
    severity =
      severityRank(severity) >= severityRank("Cảnh báo")
        ? severity
        : "Cần kiểm tra";
    status = "Thiếu cột cần đọc";
    action = `Kiểm tra header: thiếu ${missingColumns.join(", ")}`;
  }

  return {
    sheetName,
    group: sheetGroup(sheetName),
    purpose: description,
    totalRows: rows.length,
    validRows,
    invalidRows,
    missingColumns,
    severity,
    status,
    action,
  };
}

function buildSourceStatus(
  key: SourceKey,
  rows: DataRow[],
): SourceQualityStatus {
  const contract = SOURCE_CONTRACTS[key];
  const validRows = rows.filter(isValidImportRow).length;
  const invalidRows = Math.max(0, rows.length - validRows);
  const requiredForClose = REQUIRED_FOR_WEEKLY_CLOSE.includes(key);
  const missingColumns = missingColumnsForRows(
    rows,
    requiredContractColumns(key),
  );
  let severity: DataQualitySeverity = "Tốt";
  let status = "Đạt";

  if (!validRows) {
    severity = requiredForClose
      ? "Nguy hiểm"
      : REQUIRED_FOR_FULL_CEO_REPORT.includes(key)
        ? "Cảnh báo"
        : "Cần kiểm tra";
    status = "Thiếu dữ liệu";
  } else if (invalidRows > 0 || missingColumns.length) {
    severity = "Cần kiểm tra";
    status = invalidRows > 0 ? "Có dòng chưa hợp lệ" : "Thiếu cột";
  }

  return {
    key,
    sheetName: contract.sheetName,
    label: contract.label,
    totalRows: rows.length,
    validRows,
    invalidRows,
    missingColumns,
    requiredForClose,
    severity,
    status,
    businessImpact: SOURCE_BUSINESS_IMPACT[key],
    action: validRows
      ? "Theo dõi và đối chiếu khi chốt báo cáo"
      : SOURCE_ACTION[key],
  };
}

function firstNonEmpty(rows: DataRow[], columns: string[]) {
  for (const row of rows) {
    const value = pickText(row, columns);
    if (value) return value;
  }
  return undefined;
}

function importControlStatus(
  sheetRows: Record<string, DataRow[]>,
): ImportControlStatus {
  const importHistory = sheetRows[SHEET_NAMES.IMPORT_LICH_SU] ?? [];
  const latestImport = firstNonEmpty([...importHistory].reverse(), [
    "Mã lần import",
    "Ngày import",
  ]);
  return {
    errorRows: (sheetRows[SHEET_NAMES.IMPORT_DONG_LOI] ?? []).length,
    duplicateRows: (sheetRows[SHEET_NAMES.IMPORT_DU_LIEU_TRUNG] ?? []).length,
    conflictRows: (sheetRows[SHEET_NAMES.IMPORT_DU_LIEU_LECH] ?? []).length,
    failedBatches: importHistory.filter(
      (row) =>
        normalizeText(row["Trạng thái"]).includes("that bai") ||
        normalizeText(row["Trạng thái"]).includes("loi"),
    ).length,
    partialBatches: importHistory.filter((row) =>
      normalizeText(row["Trạng thái"]).includes("mot phan"),
    ).length,
    latestImport,
  };
}

function makeTask(
  partial: Omit<AccountingWorkbenchTask, "id">,
  index: number,
): AccountingWorkbenchTask {
  return { id: `DQ-${String(index + 1).padStart(3, "0")}`, ...partial };
}

function buildDataQualityTasks(
  sourceRows: SourceQualityStatus[],
  importControl: ImportControlStatus,
) {
  const tasks: AccountingWorkbenchTask[] = [];

  for (const source of sourceRows) {
    if (source.validRows > 0) continue;
    tasks.push(
      makeTask(
        {
          type: "missing_source",
          severity: source.requiredForClose ? "Nguy hiểm" : "Cảnh báo",
          task: `Import ${source.label}`,
          source: source.sheetName,
          evidence: `0 dòng hợp lệ · ${source.businessImpact}`,
          owner: "Kế toán",
          deadline: source.requiredForClose
            ? "Hôm nay"
            : "Trước khi chốt báo cáo",
          action: source.action,
          needsCeoApproval: false,
        },
        tasks.length,
      ),
    );
  }

  for (const source of sourceRows) {
    if (!source.invalidRows && !source.missingColumns.length) continue;
    tasks.push(
      makeTask(
        {
          type: "invalid_rows",
          severity: "Cần kiểm tra",
          task: `Kiểm tra dòng chưa hợp lệ ở ${source.label}`,
          source: source.sheetName,
          evidence: `${source.invalidRows} dòng chưa hợp lệ${source.missingColumns.length ? ` · thiếu cột ${source.missingColumns.join(", ")}` : ""}`,
          owner: "Kế toán",
          deadline: "Hôm nay",
          action:
            "Chỉ giữ dòng có IMP- và Đã xác nhận; kiểm tra header nếu thiếu cột.",
          needsCeoApproval: false,
        },
        tasks.length,
      ),
    );
  }

  if (importControl.errorRows > 0) {
    tasks.push(
      makeTask(
        {
          type: "import_error",
          severity: "Nguy hiểm",
          task: "Xử lý dòng lỗi import",
          source: SHEET_NAMES.IMPORT_DONG_LOI,
          evidence: `${importControl.errorRows} dòng lỗi import`,
          owner: "Kế toán",
          deadline: "Hôm nay",
          action:
            "Mở IMPORT_DONG_LOI, sửa file nguồn hoặc loại dòng lỗi trước khi chốt.",
          needsCeoApproval: false,
        },
        tasks.length,
      ),
    );
  }

  if (importControl.duplicateRows > 0) {
    tasks.push(
      makeTask(
        {
          type: "duplicate_data",
          severity: "Cảnh báo",
          task: "Rà soát dữ liệu trùng",
          source: SHEET_NAMES.IMPORT_DU_LIEU_TRUNG,
          evidence: `${importControl.duplicateRows} dòng trùng`,
          owner: "Kế toán",
          deadline: "Hôm nay",
          action:
            "Kiểm tra trùng thật hay import lại cùng file; không xác nhận nếu chưa rõ.",
          needsCeoApproval: false,
        },
        tasks.length,
      ),
    );
  }

  if (importControl.conflictRows > 0) {
    tasks.push(
      makeTask(
        {
          type: "conflict_data",
          severity: "Cảnh báo",
          task: "Xử lý dữ liệu lệch",
          source: SHEET_NAMES.IMPORT_DU_LIEU_LECH,
          evidence: `${importControl.conflictRows} dòng lệch`,
          owner: "Kế toán",
          deadline: "Hôm nay",
          action: "Đối chiếu giá trị cũ/mới, ghi lý do xử lý trước khi chốt.",
          needsCeoApproval: true,
        },
        tasks.length,
      ),
    );
  }

  return tasks;
}

function scoreFrom(
  sourceRows: SourceQualityStatus[],
  importControl: ImportControlStatus,
) {
  let score = 100;
  for (const source of sourceRows) {
    if (!source.validRows && source.requiredForClose) score -= 18;
    else if (!source.validRows) score -= 8;
    if (source.invalidRows) score -= 4;
    if (source.missingColumns.length) score -= 6;
  }
  if (importControl.errorRows) score -= 15;
  if (importControl.conflictRows) score -= 8;
  if (importControl.duplicateRows) score -= 4;
  return Math.max(0, Math.min(100, score));
}

function severityFromScore(
  score: number,
  tasks: AccountingWorkbenchTask[],
): DataQualitySeverity {
  if (tasks.some((task) => task.severity === "Nguy hiểm")) return "Nguy hiểm";
  if (score < 70) return "Cảnh báo";
  if (score < 90) return "Cần kiểm tra";
  return "Tốt";
}

export function buildDataQualityReport(
  sheetRows: Record<string, DataRow[]>,
  filter: ReportFilter = {},
): DataQualityReport {
  const sheetStatuses = GOOGLE_SHEETS_SCHEMA.map((sheet) =>
    buildSheetStatus(
      sheet.sheetName,
      sheetRows[sheet.sheetName] ?? [],
      sheet.description,
      sheet.columns,
    ),
  );
  const sourceStatuses = SOURCE_KEYS.map((key) =>
    buildSourceStatus(key, sheetRows[SOURCE_CONTRACTS[key].sheetName] ?? []),
  );
  const importControl = importControlStatus(sheetRows);
  const baseTasks = buildDataQualityTasks(sourceStatuses, importControl);
  const score = scoreFrom(sourceStatuses, importControl);
  const status = severityFromScore(score, baseTasks);
  const missingRequiredSources = sourceStatuses
    .filter((source) => source.requiredForClose && source.validRows === 0)
    .map((source) => source.sheetName);
  const warnings = [
    ...sourceStatuses
      .filter((source) => source.validRows === 0)
      .map((source) => `${source.sheetName}: ${source.businessImpact}`),
    ...(importControl.errorRows
      ? [
          `${SHEET_NAMES.IMPORT_DONG_LOI}: còn ${importControl.errorRows} dòng lỗi`,
        ]
      : []),
    ...(importControl.conflictRows
      ? [
          `${SHEET_NAMES.IMPORT_DU_LIEU_LECH}: còn ${importControl.conflictRows} dòng lệch`,
        ]
      : []),
  ];

  const matrixRows = sheetStatuses.map((sheet) => [
    sheet.sheetName,
    sheet.group,
    formatNumber(sheet.totalRows),
    formatNumber(sheet.validRows),
    formatNumber(sheet.invalidRows),
    sheet.severity,
    sheet.action,
  ]);

  const sourceMatrixRows = sourceStatuses.map((source) => [
    source.sheetName,
    source.label,
    `${formatNumber(source.validRows)}/${formatNumber(source.totalRows)} dòng`,
    source.status,
    source.businessImpact,
    source.action,
  ]);

  const taskRows = baseTasks.map((task) => [
    task.severity,
    task.task,
    task.source,
    task.evidence,
    task.owner,
    task.deadline,
    task.needsCeoApproval ? "Có" : "Không",
    task.action,
  ]);

  const summaryRows = [
    [
      "Data Quality Score",
      `${score}/100`,
      status,
      missingRequiredSources.length
        ? `Thiếu ${missingRequiredSources.length} nguồn bắt buộc`
        : "Không thiếu nguồn bắt buộc",
    ],
    [
      "Dòng lỗi import",
      formatNumber(importControl.errorRows),
      importControl.errorRows ? "Nguy hiểm" : "Tốt",
      SHEET_NAMES.IMPORT_DONG_LOI,
    ],
    [
      "Dòng trùng",
      formatNumber(importControl.duplicateRows),
      importControl.duplicateRows ? "Cảnh báo" : "Tốt",
      SHEET_NAMES.IMPORT_DU_LIEU_TRUNG,
    ],
    [
      "Dòng lệch",
      formatNumber(importControl.conflictRows),
      importControl.conflictRows ? "Cảnh báo" : "Tốt",
      SHEET_NAMES.IMPORT_DU_LIEU_LECH,
    ],
    [
      "Lần import gần nhất",
      importControl.latestImport ?? "Chưa có",
      importControl.latestImport ? "Cần kiểm tra" : "Chưa đủ dữ liệu",
      "IMPORT_LICH_SU",
    ],
  ];

  return {
    status,
    score,
    message:
      status === "Tốt"
        ? "Dữ liệu đủ tốt để xem báo cáo theo phạm vi hiện tại."
        : "Còn việc dữ liệu cần kế toán xử lý trước khi chốt báo cáo CEO.",
    filter,
    sheetRows: sheetStatuses,
    sourceRows: sourceStatuses,
    importControl,
    missingRequiredSources,
    warnings,
    tasks: baseTasks,
    matrixRows,
    sourceMatrixRows,
    taskRows,
    summaryRows,
  };
}

export type { DataQualityReport } from "./data-quality-types";
