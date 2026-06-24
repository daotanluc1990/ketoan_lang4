import type { SourceKey } from "@/lib/reports/source-contract";

export const REQUIRED_FOR_WEEKLY_CLOSE: SourceKey[] = [
  "storeRevenue",
  "appRevenue",
  "cashbook",
];

export const REQUIRED_FOR_FULL_CEO_REPORT: SourceKey[] = [
  "storeRevenue",
  "appRevenue",
  "cashbook",
  "inventory",
  "lossRows",
];

export const OPTIONAL_CROSS_CHECK_SOURCES: SourceKey[] = ["debt", "purchase"];

export const DATA_QUALITY_THRESHOLDS = {
  invalidRowWarning: 1,
  errorRowsDanger: 1,
  duplicateRowsWarning: 1,
  conflictRowsWarning: 1,
  unknownExpenseWarningAmount: 1_000_000,
  largeExpenseWarningAmount: 3_000_000,
};

export const SOURCE_BUSINESS_IMPACT: Record<SourceKey, string> = {
  storeRevenue:
    "Thiếu nguồn này thì không kết luận được doanh thu cửa hàng và tổng doanh thu.",
  appRevenue:
    "Thiếu nguồn này thì không kết luận được doanh thu app, phí app và tiền app cần đối soát.",
  cashbook:
    "Thiếu nguồn này thì không biết tiền vào/ra, chi bất thường và dòng tiền tuần.",
  inventory:
    "Thiếu nguồn này thì cân đối rút gọn và kiểm soát tồn kho chưa đủ.",
  lossRows:
    "Thiếu nguồn này thì không kết luận được thất thoát NVL theo định mức.",
  debt: "Thiếu nguồn này thì khoản trả NCC từ sổ quỹ chưa biết là trả nợ cũ hay mua mới.",
  purchase:
    "Thiếu nguồn này thì chưa giải thích được biến động giá mua và tác động tiền.",
};

export const SOURCE_ACTION: Record<SourceKey, string> = {
  storeRevenue: "Import báo cáo doanh thu cửa hàng và xác nhận batch đạt.",
  appRevenue: "Import báo cáo doanh thu app và xác nhận batch đạt.",
  cashbook: "Import file sổ quỹ và xác nhận batch đạt.",
  inventory: "Import tồn kho để đối chiếu cân đối và tồn âm.",
  lossRows: "Import báo cáo thất thoát NVL tuần.",
  debt: "Import công nợ để đối chiếu tiền trả NCC.",
  purchase: "Import thu mua để phân tích giá và mua NVL.",
};
