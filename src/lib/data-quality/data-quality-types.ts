import type { SourceKey } from "@/lib/reports/source-contract";
import type { ReportFilter } from "@/lib/reports/report-filters";

export type DataQualitySeverity =
  | "Tốt"
  | "Cần kiểm tra"
  | "Cảnh báo"
  | "Nguy hiểm";
export type AccountingTaskOwner = "Kế toán" | "CEO" | "CEO/Kế toán";
export type AccountingTaskType =
  | "missing_source"
  | "invalid_rows"
  | "import_error"
  | "duplicate_data"
  | "conflict_data"
  | "cashbook_classification"
  | "cross_check"
  | "ceo_approval"
  | "close_report";

export type SheetQualityStatus = {
  sheetName: string;
  group: "Nguồn dữ liệu" | "Báo cáo/Công việc" | "Import/Audit" | "Cấu hình";
  purpose: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingColumns: string[];
  severity: DataQualitySeverity;
  status: string;
  action: string;
};

export type SourceQualityStatus = {
  key: SourceKey;
  sheetName: string;
  label: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingColumns: string[];
  requiredForClose: boolean;
  severity: DataQualitySeverity;
  status: string;
  businessImpact: string;
  action: string;
};

export type ImportControlStatus = {
  errorRows: number;
  duplicateRows: number;
  conflictRows: number;
  failedBatches: number;
  partialBatches: number;
  latestImport?: string;
};

export type AccountingWorkbenchTask = {
  id: string;
  type: AccountingTaskType;
  severity: DataQualitySeverity;
  task: string;
  source: string;
  evidence: string;
  owner: AccountingTaskOwner;
  deadline: string;
  action: string;
  needsCeoApproval: boolean;
};

export type DataQualityReport = {
  status: DataQualitySeverity;
  score: number;
  message: string;
  filter: ReportFilter;
  sheetRows: SheetQualityStatus[];
  sourceRows: SourceQualityStatus[];
  importControl: ImportControlStatus;
  missingRequiredSources: string[];
  warnings: string[];
  tasks: AccountingWorkbenchTask[];
  matrixRows: string[][];
  sourceMatrixRows: string[][];
  taskRows: string[][];
  summaryRows: string[][];
};
