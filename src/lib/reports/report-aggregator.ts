import { getDataStore } from "@/lib/data-store";
import { getServerEnv } from "@/lib/env/server-env";
import { SHEET_NAMES } from "@/lib/google-sheets/sheet-names";
import type { Status } from "@/lib/report-types";
import {
  buildFilterOptions,
  applySourceFilter,
  createFilterMetadata,
  parseReportFilterFromSearchParams,
  isValidImportRow,
  type FilterOptions,
  type ReportFilter,
  type ReportFilterMetadata,
} from "./report-filters";
import { pickNumber, type DataRow } from "./row-normalizers";
import {
  SOURCE_CONTRACTS,
  SOURCE_KEYS,
  type SourceKey,
} from "./source-contract";
import { analyzeCashbookRows } from "./cashbook-analysis";
import { GOOGLE_SHEETS_SCHEMA } from "@/lib/google-sheets/schema";
import {
  buildDataQualityReport,
  type DataQualityReport,
} from "@/lib/data-quality/data-quality-engine";
import {
  buildAccountingWorkbenchTasks,
  tasksToRows,
} from "@/lib/data-quality/accounting-workbench-agent";
import { calculatePnl } from '@/lib/finance/pl-calculator';
import { calculateBalance } from '@/lib/finance/balance-calculator';
import { calculateLoss } from '@/lib/finance/loss-calculator';
import {
  buildWeekComparison,
  formatDelta,
  groupCashbookByWeek,
  sumNegativeAbs,
  sumPositive,
} from "./report-comparisons";

export type Kpi = {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  status?: Status;
};

export type SourceCounts = Record<SourceKey, number> & {
  auditRows: number;
  importHistory: number;
};

export type DashboardReport = {
  dataMode: "google_sheets" | "local" | "missing_data" | "error";
  hasRealData: boolean;
  message: string;
  executiveKpis: Kpi[];
  pnlRows: string[][];
  cashflowRows: string[][];
  cashbookGroupRows: string[][];
  cashbookLargeExpenseRows: string[][];
  accountingTaskRows: string[][];
  accountingWorkbenchTaskRows: string[][];
  dataQualityMatrixRows: string[][];
  dataQualitySourceRows: string[][];
  dataQualitySummaryRows: string[][];
  dataQuality: DataQualityReport;
  ceoActionRows: string[][];
  sourceReadinessRows: string[][];
  financeEvidenceRows: string[][];
  financeLimitationRows: string[][];
  cashflowTrendRows: string[][];
  cashflowWeeklyRows: string[][];
  balanceRows: string[][];
  lossTop5Rows: string[][];
  issueRows: string[][];
  revenueByChannel: Array<{ channel: string; revenue: string; value: number }>;
  sourceCounts: SourceCounts;
  totals: {
    revenue: number;
    storeSales: number;
    appNet: number;
    appGross: number;
    appFees: number;
    appCogs: number;
    cashIn: number;
    cashOut: number;
    cashEnding: number;
    cashOperatingOut: number;
    cashUnclassifiedOut: number;
    cashDebtPaymentOut: number;
    cashCapexOut: number;
    inventoryValue: number;
    negativeStockCount: number;
    lossValue: number;
    cogsPercent: number;
    appFeePercent: number;
  };
  missingSources: string[];
  filterMetadata: ReportFilterMetadata;
  filterOptions?: FilterOptions;
  errors?: string[];
};

const EMPTY_SOURCE_COUNTS: SourceCounts = {
  storeRevenue: 0,
  appRevenue: 0,
  cashbook: 0,
  inventory: 0,
  lossRows: 0,
  debt: 0,
  purchase: 0,
  auditRows: 0,
  importHistory: 0,
};

function sum(rows: DataRow[], columns: string[]) {
  return rows.reduce((total, row) => total + pickNumber(row, columns), 0);
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`;
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")}tr`;
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

function statusFromRatio(
  value: number,
  warning: number,
  danger: number,
): Status {
  if (!Number.isFinite(value) || value <= 0) return "neutral";
  if (value >= danger) return "danger";
  if (value >= warning) return "warning";
  return "good";
}

function formatSignedMoney(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0đ";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

function statusForReadiness(count: number, requiredForCeo: boolean): string {
  if (count > 0) return "Đạt";
  return requiredForCeo ? "Thiếu dữ liệu" : "Chưa có dữ liệu";
}

function buildSourceReadinessRows(
  sourceCounts: SourceCounts,
  beforeCounts: Record<SourceKey, number>,
) {
  const rows: string[][] = [
    [
      SHEET_NAMES.DL_SO_QUY,
      "Dòng tiền, chi bất thường, việc kế toán, cảnh báo CEO",
      `${sourceCounts.cashbook}/${beforeCounts.cashbook} dòng`,
      statusForReadiness(sourceCounts.cashbook, true),
      "Dữ liệu ưu tiên hiện tại",
    ],
    [
      SHEET_NAMES.DL_DOANH_THU_CUA_HANG,
      "Doanh thu offline, số phần/hộp/dĩa, đối chiếu tiền thu",
      `${sourceCounts.storeRevenue}/${beforeCounts.storeRevenue} dòng`,
      statusForReadiness(sourceCounts.storeRevenue, true),
      "Thiếu thì không kết luận tổng doanh thu",
    ],
    [
      SHEET_NAMES.DL_DOANH_THU_APP,
      "Doanh thu app, phí app, số đơn, doanh thu ròng",
      `${sourceCounts.appRevenue}/${beforeCounts.appRevenue} dòng`,
      statusForReadiness(sourceCounts.appRevenue, true),
      "Thiếu thì không kết luận app/chưa về",
    ],
    [
      SHEET_NAMES.DL_TON_KHO,
      "Tồn kho, tồn âm, giá trị hàng tồn",
      `${sourceCounts.inventory}/${beforeCounts.inventory} dòng`,
      statusForReadiness(sourceCounts.inventory, false),
      "Dùng cho cân đối và kiểm soát kho",
    ],
    [
      SHEET_NAMES.DL_THAT_THOAT_NVL,
      "Thất thoát định mức, chênh lệch NVL",
      `${sourceCounts.lossRows}/${beforeCounts.lossRows} dòng`,
      statusForReadiness(sourceCounts.lossRows, false),
      "Dùng cho cảnh báo thất thoát",
    ],
    [
      SHEET_NAMES.DL_CONG_NO,
      "Đối chiếu trả NCC/công nợ/cần CEO duyệt",
      `${sourceCounts.debt}/${beforeCounts.debt} dòng`,
      statusForReadiness(sourceCounts.debt, false),
      "Cần để hiểu khoản trả NCC từ sổ quỹ",
    ],
    [
      SHEET_NAMES.DL_THU_MUA,
      "Biến động giá, tác động tiền, mua NVL",
      `${sourceCounts.purchase}/${beforeCounts.purchase} dòng`,
      statusForReadiness(sourceCounts.purchase, false),
      "Cần để giải thích chi NVL/bao bì",
    ],
  ];
  return rows;
}

async function safeRead(sheetName: string) {
  try {
    return await getDataStore().read(sheetName);
  } catch (error) {
    console.error(
      `[report-aggregator] Cannot read ${sheetName}:`,
      error instanceof Error ? error.message : error,
    );
    return [] as DataRow[];
  }
}

function sourceSheetName(key: SourceKey) {
  return SOURCE_CONTRACTS[key].sheetName;
}

function buildFilterMetadata(
  filter: ReportFilter,
  before: Record<SourceKey, number>,
  after: Record<SourceKey, number>,
) {
  return createFilterMetadata(filter, before, after);
}

function emptyReport(
  filter: ReportFilter = {},
  metadata?: ReportFilterMetadata,
  errors: string[] = [],
): DashboardReport {
  const env = getServerEnv();
  const filterMetadata =
    metadata ??
    buildFilterMetadata(filter, EMPTY_SOURCE_COUNTS, EMPTY_SOURCE_COUNTS);
  const dataQuality = buildDataQualityReport({}, filter);
  return {
    dataMode:
      env.dataStore === "google_sheets" ? "google_sheets" : "missing_data",
    hasRealData: false,
    message: filterMetadata.activeFilterCount
      ? "Chưa đủ dữ liệu để kết luận trong phạm vi bộ lọc hiện tại. Hãy đổi kỳ/chi nhánh/kênh hoặc import dữ liệu thật."
      : "Chưa đủ dữ liệu để kết luận. Vui lòng import dữ liệu thật rồi xác nhận ghi Google Sheet.",
    executiveKpis: [
      {
        label: "Tổng doanh thu",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu import thật",
        hint: "Không dùng dữ liệu mẫu",
      },
      {
        label: "Doanh thu cửa hàng",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import doanh thu cửa hàng",
      },
      {
        label: "Doanh thu app net",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import doanh thu app",
      },
      {
        label: "Dòng tiền",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import sổ quỹ",
      },
      {
        label: "Tồn kho",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import tồn kho",
      },
      {
        label: "Thất thoát NVL",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import thất thoát",
      },
    ],
    pnlRows: [
      [
        "Dữ liệu",
        "P&L Tuần",
        "Chưa đủ dữ liệu",
        "—",
        "—",
        "—",
        "Không kết luận",
      ],
    ],
    cashflowRows: [
      [
        "Dữ liệu",
        "Dòng tiền Tuần",
        "Chưa đủ dữ liệu",
        "—",
        "—",
        "Chưa đối chiếu",
        "Cần import sổ quỹ",
      ],
    ],
    cashbookGroupRows: [],
    cashbookLargeExpenseRows: [],
    accountingTaskRows: dataQuality.taskRows.length
      ? dataQuality.taskRows
      : [
          [
            "Cảnh báo",
            "Import sổ quỹ để kiểm tra tiền vào/ra",
            SHEET_NAMES.DL_SO_QUY,
            "Chưa có DL_SO_QUY hợp lệ",
            "Kế toán",
            "Hôm nay",
            "Không",
            "Import file sổ quỹ",
          ],
        ],
    accountingWorkbenchTaskRows: dataQuality.taskRows,
    dataQualityMatrixRows: dataQuality.matrixRows,
    dataQualitySourceRows: dataQuality.sourceMatrixRows,
    dataQualitySummaryRows: dataQuality.summaryRows,
    dataQuality,
    ceoActionRows: [
      [
        "1",
        "Chưa đủ dữ liệu để CEO kết luận",
        "Không có dòng import hợp lệ",
        "Import đủ nguồn dữ liệu thật",
        "CEO/Kế toán",
      ],
    ],
    sourceReadinessRows: [],
    financeEvidenceRows: [],
    financeLimitationRows: [],
    cashflowTrendRows: [],
    cashflowWeeklyRows: [],
    balanceRows: [
      [
        "Dữ liệu",
        "Cân đối rút gọn",
        "Chưa đủ dữ liệu",
        "—",
        "—",
        "Chưa đủ dữ liệu",
        "Cần import sổ quỹ/tồn kho/công nợ",
      ],
    ],
    lossTop5Rows: [],
    issueRows: [
      [
        "1",
        "Chưa đủ dữ liệu để kết luận",
        "Không hiển thị số mẫu",
        filterMetadata.filterSummary.join(" • ") ||
          "Google Sheet chưa có dữ liệu import thật",
        "Import đủ file hoặc điều chỉnh bộ lọc",
      ],
    ],
    revenueByChannel: [],
    sourceCounts: { ...EMPTY_SOURCE_COUNTS },
    totals: {
      revenue: 0,
      storeSales: 0,
      appNet: 0,
      appGross: 0,
      appFees: 0,
      appCogs: 0,
      cashIn: 0,
      cashOut: 0,
      cashEnding: 0,
      cashOperatingOut: 0,
      cashUnclassifiedOut: 0,
      cashDebtPaymentOut: 0,
      cashCapexOut: 0,
      inventoryValue: 0,
      negativeStockCount: 0,
      lossValue: 0,
      cogsPercent: 0,
      appFeePercent: 0,
    },
    missingSources: [
      SHEET_NAMES.DL_DOANH_THU_APP,
      SHEET_NAMES.DL_DOANH_THU_CUA_HANG,
      SHEET_NAMES.DL_SO_QUY,
      SHEET_NAMES.DL_TON_KHO,
      SHEET_NAMES.DL_THAT_THOAT_NVL,
    ],
    filterMetadata,
    errors,
  };
}

export async function readAllKnownSheetRows() {
  const sheetNames = Array.from(
    new Set(GOOGLE_SHEETS_SCHEMA.map((sheet) => sheet.sheetName)),
  );
  const entries = await Promise.all(
    sheetNames.map(
      async (sheetName) => [sheetName, await safeRead(sheetName)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<string, DataRow[]>;
}

export async function readReportSourceRows() {
  const allRows = await readAllKnownSheetRows();
  return Object.fromEntries(
    SOURCE_KEYS.map(
      (key) => [key, allRows[sourceSheetName(key)] ?? []] as const,
    ),
  ) as Record<SourceKey, DataRow[]>;
}

export async function getReportFilterOptions(): Promise<FilterOptions> {
  const rows = await readReportSourceRows();
  return buildFilterOptions(rows);
}

export async function buildDashboardReport(
  filterInput:
    | ReportFilter
    | URLSearchParams
    | Record<string, string | string[] | undefined> = {},
): Promise<DashboardReport> {
  const env = getServerEnv();
  const filter =
    filterInput instanceof URLSearchParams ||
    !(
      "fromDate" in filterInput ||
      "toDate" in filterInput ||
      "weekCode" in filterInput ||
      "branch" in filterInput
    )
      ? parseReportFilterFromSearchParams(
          filterInput as
            | URLSearchParams
            | Record<string, string | string[] | undefined>,
        )
      : (filterInput as ReportFilter);

  const allSheetRows = await readAllKnownSheetRows();
  const sourceRows = Object.fromEntries(
    SOURCE_KEYS.map(
      (key) => [key, allSheetRows[sourceSheetName(key)] ?? []] as const,
    ),
  ) as Record<SourceKey, DataRow[]>;
  const auditRows = allSheetRows[SHEET_NAMES.AUDIT_LOG] ?? [];
  const importHistory = allSheetRows[SHEET_NAMES.IMPORT_LICH_SU] ?? [];

  const beforeCounts = SOURCE_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: sourceRows[key].filter(isValidImportRow).length,
    }),
    {} as Record<SourceKey, number>,
  );
  const filteredSources = SOURCE_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: applySourceFilter(sourceRows[key], key, filter),
    }),
    {} as Record<SourceKey, DataRow[]>,
  );
  const afterCounts = SOURCE_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: filteredSources[key].length }),
    {} as Record<SourceKey, number>,
  );
  const filterMetadata = buildFilterMetadata(filter, beforeCounts, afterCounts);

  const storeRevenue = filteredSources.storeRevenue;
  const appRevenue = filteredSources.appRevenue;
  const cashbook = filteredSources.cashbook;
  const inventory = filteredSources.inventory;
  const lossRows = filteredSources.lossRows;
  const debt = filteredSources.debt;
  const purchase = filteredSources.purchase;

  const sourceCounts: SourceCounts = {
    storeRevenue: storeRevenue.length,
    appRevenue: appRevenue.length,
    cashbook: cashbook.length,
    inventory: inventory.length,
    lossRows: lossRows.length,
    debt: debt.length,
    purchase: purchase.length,
    auditRows: auditRows.length,
    importHistory: importHistory.length,
  };

  const dataQuality = buildDataQualityReport(allSheetRows, filter);

  const hasRealData = SOURCE_KEYS.some((key) => afterCounts[key] > 0);
  if (!hasRealData) return emptyReport(filter, filterMetadata);

  const storeSales = sum(storeRevenue, [
    "Doanh thu bán hàng thực",
    "Tổng doanh thu theo file",
  ]);
  const appNet = sum(appRevenue, ["Doanh thu ròng"]);
  const appGross = sum(appRevenue, ["Doanh thu gộp"]);
  const appFees = sum(appRevenue, ["Tổng khấu trừ/phí"]);
  const appCogs = sum(appRevenue, ["Giá vốn"]);
  const cashIn = cashbook
    .filter((row) => pickNumber(row, ["Số tiền", "Giá trị"]) > 0)
    .reduce((total, row) => total + pickNumber(row, ["Số tiền", "Giá trị"]), 0);
  const cashOut = Math.abs(
    cashbook
      .filter((row) => pickNumber(row, ["Số tiền", "Giá trị"]) < 0)
      .reduce(
        (total, row) => total + pickNumber(row, ["Số tiền", "Giá trị"]),
        0,
      ),
  );
  const inventoryValue = sum(inventory, ["Giá trị tồn", "Giá trị tồn kho"]);
  const negativeStockCount = inventory.filter(
    (row) => pickNumber(row, ["Tồn kho", "Tồn kho hiện tại"]) < 0,
  ).length;
  const lossValue = lossRows.reduce(
    (total, row) => total + Math.abs(pickNumber(row, ["Giá trị chênh lệch"])),
    0,
  );
  const revenue = storeSales + appNet;
  const cogsPercent = revenue ? (appCogs + lossValue) / revenue : 0;
  const appFeePercent = appGross ? appFees / appGross : 0;
  const cashEnding = cashIn - cashOut;
  const cashbookAnalysis = analyzeCashbookRows(cashbook, {
    debt: debt.length,
    purchase: purchase.length,
    inventory: inventory.length,
    lossRows: lossRows.length,
  });
  const pnlCalculation = calculatePnl({
    storeRevenueRows: storeRevenue,
    appRevenueRows: appRevenue,
    cashbookRows: cashbook,
    lossRows,
    filter,
  });
  const balanceCalculation = calculateBalance({
    cashbookRows: cashbook,
    inventoryRows: inventory,
    debtRows: debt,
    purchaseRows: purchase,
    filter,
  });
  const lossCalculation = calculateLoss({ lossRows, filter });
  const accountingWorkbenchTasks = buildAccountingWorkbenchTasks({
    dataQuality,
    cashbookAnalysis,
    sourceCounts,
  });
  const accountingWorkbenchTaskRows = tasksToRows(accountingWorkbenchTasks);
  const allValidCashbook = sourceRows.cashbook.filter(isValidImportRow);
  const currentWeekCode = filter.weekCode;
  const cashbookWeekComparison = buildWeekComparison(
    allValidCashbook,
    currentWeekCode,
  );
  const currentWeekRows = currentWeekCode
    ? cashbookWeekComparison.currentRows
    : cashbook;
  const previousWeekRows = currentWeekCode
    ? cashbookWeekComparison.previousRows
    : [];
  const currentWeekIn = currentWeekCode
    ? sumPositive(currentWeekRows, ["Số tiền", "Giá trị"])
    : cashIn;
  const currentWeekOut = currentWeekCode
    ? sumNegativeAbs(currentWeekRows, ["Số tiền", "Giá trị"])
    : cashOut;
  const previousWeekIn = sumPositive(previousWeekRows, ["Số tiền", "Giá trị"]);
  const previousWeekOut = sumNegativeAbs(previousWeekRows, [
    "Số tiền",
    "Giá trị",
  ]);
  const cashflowTrendRows = currentWeekCode
    ? [
        [
          "Tiền vào",
          formatMoney(currentWeekIn),
          previousWeekRows.length
            ? formatMoney(previousWeekIn)
            : "Chưa có tuần trước",
          previousWeekRows.length
            ? formatDelta(currentWeekIn, previousWeekIn)
            : "Chưa đủ dữ liệu",
          currentWeekIn >= previousWeekIn ? "Tốt" : "Cần xem",
        ],
        [
          "Tiền ra",
          formatMoney(currentWeekOut),
          previousWeekRows.length
            ? formatMoney(previousWeekOut)
            : "Chưa có tuần trước",
          previousWeekRows.length
            ? formatDelta(currentWeekOut, previousWeekOut)
            : "Chưa đủ dữ liệu",
          currentWeekOut > previousWeekOut * 1.25 && previousWeekOut
            ? "Cảnh báo"
            : "Theo dõi",
        ],
        [
          "Dòng tiền thuần",
          formatMoney(currentWeekIn - currentWeekOut),
          previousWeekRows.length
            ? formatMoney(previousWeekIn - previousWeekOut)
            : "Chưa có tuần trước",
          previousWeekRows.length
            ? formatDelta(
                currentWeekIn - currentWeekOut,
                previousWeekIn - previousWeekOut,
              )
            : "Chưa đủ dữ liệu",
          currentWeekIn - currentWeekOut < 0 ? "Nguy hiểm" : "Tốt",
        ],
      ]
    : [
        [
          "So sánh tuần",
          "Chưa chọn mã tuần",
          "—",
          "—",
          "Chọn Mã tuần để so tuần trước",
        ],
      ];
  const cashflowWeeklyRows = groupCashbookByWeek(allValidCashbook).map(
    (item) => [
      item.week,
      `${item.from ?? "—"} → ${item.to ?? "—"}`,
      String(item.rows),
      formatMoney(item.cashIn),
      formatMoney(item.cashOut),
      formatSignedMoney(item.cashNet),
      item.cashNet < 0 ? "Cảnh báo" : "Tốt",
    ],
  );

  const missingSources = [
    storeRevenue.length ? "" : SHEET_NAMES.DL_DOANH_THU_CUA_HANG,
    appRevenue.length ? "" : SHEET_NAMES.DL_DOANH_THU_APP,
    cashbook.length ? "" : SHEET_NAMES.DL_SO_QUY,
    inventory.length ? "" : SHEET_NAMES.DL_TON_KHO,
    lossRows.length ? "" : SHEET_NAMES.DL_THAT_THOAT_NVL,
  ].filter(Boolean);

  const topLossRows = lossCalculation.topRows;


  const revenueByChannel = [
    {
      channel: "Cửa hàng",
      revenue: formatMoney(storeSales),
      value: storeSales,
    },
    { channel: "App net", revenue: formatMoney(appNet), value: appNet },
  ].filter((item) => item.value > 0);

  const filterHint = filterMetadata.filterSummary.length
    ? `Bộ lọc: ${filterMetadata.filterSummary.join(" • ")}`
    : "Không áp bộ lọc";
  const executiveKpis: Kpi[] = [
    {
      label: "Tổng doanh thu",
      value: formatMoney(revenue),
      hint: "Cửa hàng thực + app net",
      trend: filterHint,
      status: revenue > 0 ? "good" : "warning",
    },
    {
      label: "Doanh thu cửa hàng",
      value: formatMoney(storeSales),
      hint: "Tiền mặt + MoMo/chuyển khoản",
      trend: `${storeRevenue.length}/${beforeCounts.storeRevenue} dòng`,
      status: storeSales > 0 ? "good" : "warning",
    },
    {
      label: "Doanh thu app net",
      value: formatMoney(appNet),
      hint: "Sau phí app",
      trend: `App fee ${formatPercent(appFeePercent)} · ${appRevenue.length}/${beforeCounts.appRevenue} dòng`,
      status: statusFromRatio(appFeePercent, 0.35, 0.45),
    },
    {
      label: "Tiền vào",
      value: formatMoney(cashIn),
      hint: "Sổ quỹ phiếu thu",
      trend: `${cashbook.length}/${beforeCounts.cashbook} dòng sổ quỹ`,
      status: cashIn > 0 ? "good" : "warning",
    },
    {
      label: "Tiền ra",
      value: formatMoney(cashOut),
      hint: "Sổ quỹ phiếu chi",
      trend: cashOut > 0 ? "Đã ghi nhận chi" : "Chưa đủ dữ liệu",
      status: cashOut > cashIn ? "danger" : "good",
    },
    {
      label: "Dòng tiền tạm",
      value: formatMoney(cashEnding),
      hint: "Thu - chi",
      trend: cashEnding < 0 ? "Âm dòng tiền" : "Dương dòng tiền",
      status: cashEnding < 0 ? "danger" : "good",
    },
    {
      label: "Chi cần phân loại",
      value: formatMoney(cashbookAnalysis.unclassifiedOut),
      hint: "Nhóm Khác/cần rõ bản chất",
      trend: cashbookAnalysis.unclassifiedOut
        ? "Kế toán cần xử lý"
        : "Không phát hiện",
      status: cashbookAnalysis.unclassifiedOut ? "warning" : "good",
    },
    {
      label: "Chi lớn bất thường",
      value: `${cashbookAnalysis.largeExpenseCount} khoản`,
      hint: "Từ DL_SO_QUY",
      trend: cashbookAnalysis.largeExpenseCount
        ? "Cần kiểm chứng hóa đơn/diễn giải"
        : "Chưa phát hiện",
      status: cashbookAnalysis.largeExpenseCount ? "warning" : "good",
    },
    {
      label: "Tồn kho",
      value: formatMoney(inventoryValue),
      hint: `${negativeStockCount} mặt hàng tồn âm`,
      trend: `${inventory.length}/${beforeCounts.inventory} dòng tồn`,
      status: negativeStockCount ? "warning" : "good",
    },
    {
      label: "Thất thoát quy tiền",
      value: formatMoney(lossValue),
      hint: "Tổng trị tuyệt đối chênh lệch",
      trend: `${lossRows.length}/${beforeCounts.lossRows} dòng NVL`,
      status: lossValue > 0 ? "warning" : "neutral",
    },
  ];

  const pnlRows = pnlCalculation.rows;


  const cashflowRows = [
    [
      "Sổ quỹ",
      "Tổng tiền vào",
      cashbook.length ? formatMoney(cashIn) : "Chưa đủ dữ liệu",
      "—",
      "—",
      cashbook.length ? "Đã đối chiếu" : "Chưa đối chiếu",
      "Đọc từ DL_SO_QUY",
    ],
    [
      "Sổ quỹ",
      "Tổng tiền ra",
      cashbook.length ? formatMoney(cashOut) : "Chưa đủ dữ liệu",
      "—",
      "—",
      cashbook.length ? "Đã đối chiếu" : "Chưa đối chiếu",
      "Đọc từ DL_SO_QUY",
    ],
    [
      "Sổ quỹ",
      "Dòng tiền tạm",
      cashbook.length ? formatMoney(cashEnding) : "Chưa đủ dữ liệu",
      "—",
      "—",
      cashbook.length ? "Đã đối chiếu" : "Chưa đối chiếu",
      "Thu - chi",
    ],
    [
      "Sổ quỹ",
      "Chi phí vận hành tạm",
      cashbook.length
        ? formatMoney(cashbookAnalysis.operatingOut)
        : "Chưa đủ dữ liệu",
      "—",
      "—",
      cashbook.length ? "Cần kiểm" : "Chưa đối chiếu",
      "Loại trừ trả NCC/capex/khác chưa phân loại",
    ],
    [
      "Sổ quỹ",
      "Chi cần phân loại/đối chiếu",
      cashbook.length
        ? formatMoney(
            cashbookAnalysis.unclassifiedOut +
              cashbookAnalysis.nccPaymentOut +
              cashbookAnalysis.capexOut,
          )
        : "Chưa đủ dữ liệu",
      "—",
      "—",
      cashbook.length ? "Cần đối chiếu" : "Chưa đối chiếu",
      "Không kết luận là chi phí tuần nếu chưa có chứng cứ",
    ],
  ];

  const balanceRows = balanceCalculation.rows;


  const sourceReadinessRows = buildSourceReadinessRows(
    sourceCounts,
    beforeCounts,
  );
  const missingSourceIssues = missingSources.map((source, index) => [
    String(cashbookAnalysis.issueRows.length + index + 1),
    `Thiếu dữ liệu ${source} trong phạm vi lọc`,
    "Không đủ dữ liệu kết luận",
    filterHint,
    "Import file tương ứng hoặc đổi bộ lọc",
  ]);
  const issueRows = [...cashbookAnalysis.issueRows, ...missingSourceIssues]
    .length
    ? [...cashbookAnalysis.issueRows, ...missingSourceIssues]
    : [
        [
          "1",
          negativeStockCount ? "Có tồn kho âm" : "Dữ liệu đủ để xem báo cáo",
          negativeStockCount
            ? `${negativeStockCount} mặt hàng`
            : "Không có thiếu nguồn chính",
          negativeStockCount ? "Có thể do kiểm kê/nhập xuất lệch" : filterHint,
          negativeStockCount ? "Kế toán đối chiếu tồn kho" : "Theo dõi tiếp",
        ],
      ];
  const ceoActionRows = issueRows
    .slice(0, 5)
    .map((row, index) => [
      String(index + 1),
      row[1] ?? "Cần kiểm tra",
      row[2] ?? "—",
      row[4] ?? "Kế toán kiểm tra",
      row[1]?.includes("Thiếu dữ liệu")
        ? "Kế toán"
        : row[1]?.includes("capex")
          ? "CEO/Kế toán"
          : "Kế toán",
    ]);

  return {
    dataMode: env.dataStore === "google_sheets" ? "google_sheets" : "local",
    hasRealData,
    message: missingSources.length
      ? `Đã có dữ liệu theo bộ lọc nhưng còn thiếu: ${missingSources.join(", ")}.`
      : "Đã đọc dữ liệu thật từ Google Sheet/data store theo bộ lọc hiện tại.",
    executiveKpis,
    pnlRows,
    cashflowRows,
    cashbookGroupRows: cashbookAnalysis.groupRows,
    cashbookLargeExpenseRows: cashbookAnalysis.largeExpenseRows,
    accountingTaskRows: accountingWorkbenchTaskRows,
    accountingWorkbenchTaskRows,
    dataQualityMatrixRows: dataQuality.matrixRows,
    dataQualitySourceRows: dataQuality.sourceMatrixRows,
    dataQualitySummaryRows: dataQuality.summaryRows,
    dataQuality,
    ceoActionRows,
    sourceReadinessRows,
    financeEvidenceRows: [
      ...pnlCalculation.evidenceRows,
      ...balanceCalculation.evidenceRows,
      ...lossCalculation.evidenceRows,
    ],
    financeLimitationRows: [
      ...pnlCalculation.limitations.map((item) => ['P&L', item]),
      ...balanceCalculation.limitations.map((item) => ['Cân đối', item]),
      ...lossCalculation.limitations.map((item) => ['Thất thoát', item]),
    ],
    cashflowTrendRows,
    cashflowWeeklyRows,
    balanceRows,
    lossTop5Rows: topLossRows,
    issueRows,
    revenueByChannel,
    sourceCounts,
    totals: {
      revenue,
      storeSales,
      appNet,
      appGross,
      appFees,
      appCogs,
      cashIn,
      cashOut,
      cashEnding,
      cashOperatingOut: cashbookAnalysis.operatingOut,
      cashUnclassifiedOut: cashbookAnalysis.unclassifiedOut,
      cashDebtPaymentOut: cashbookAnalysis.nccPaymentOut,
      cashCapexOut: cashbookAnalysis.capexOut,
      inventoryValue,
      negativeStockCount,
      lossValue,
      cogsPercent,
      appFeePercent,
    },
    missingSources,
    filterMetadata,
  };
}
