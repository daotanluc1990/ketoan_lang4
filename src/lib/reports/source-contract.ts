import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export type SourceKey =
  | 'storeRevenue'
  | 'appRevenue'
  | 'cashbook'
  | 'inventory'
  | 'lossRows'
  | 'debt'
  | 'purchase';

export type SourceContract = {
  key: SourceKey;
  sheetName: string;
  label: string;
  dateColumns: string[];
  weekColumns: string[];
  branchColumns: string[];
  channelColumns: string[];
  statusColumns: string[];
  alertStatusColumns: string[];
  importedByColumns: string[];
};

export const SOURCE_CONTRACTS: Record<SourceKey, SourceContract> = {
  storeRevenue: {
    key: 'storeRevenue',
    sheetName: SHEET_NAMES.DL_DOANH_THU_CUA_HANG,
    label: 'Doanh thu cửa hàng',
    dateColumns: ['Ngày'],
    weekColumns: ['Mã tuần', 'Tuần'],
    branchColumns: ['Chi nhánh'],
    channelColumns: ['Ca bán'],
    statusColumns: ['Trạng thái dữ liệu'],
    alertStatusColumns: [],
    importedByColumns: ['Người import']
  },
  appRevenue: {
    key: 'appRevenue',
    sheetName: SHEET_NAMES.DL_DOANH_THU_APP,
    label: 'Doanh thu app',
    dateColumns: ['Ngày'],
    weekColumns: ['Mã tuần', 'Tuần'],
    branchColumns: ['Chi nhánh'],
    channelColumns: ['Kênh bán', 'Tài khoản app'],
    statusColumns: ['Trạng thái dữ liệu'],
    alertStatusColumns: [],
    importedByColumns: ['Người import']
  },
  cashbook: {
    key: 'cashbook',
    sheetName: SHEET_NAMES.DL_SO_QUY,
    label: 'Sổ quỹ',
    dateColumns: ['Ngày'],
    weekColumns: ['Mã tuần', 'Tuần'],
    branchColumns: ['Chi nhánh', 'Khu vực'],
    channelColumns: ['Phương thức', 'Nhóm thu/chi', 'Kênh thu', 'Khu vực', 'Phân loại P&L'],
    statusColumns: ['Trạng thái dữ liệu'],
    alertStatusColumns: [],
    importedByColumns: ['Người import', 'Người tạo']
  },
  inventory: {
    key: 'inventory',
    sheetName: SHEET_NAMES.DL_TON_KHO,
    label: 'Tồn kho',
    dateColumns: ['Ngày kiểm kê'],
    weekColumns: [],
    branchColumns: ['Chi nhánh'],
    channelColumns: ['Nhóm hàng'],
    statusColumns: ['Trạng thái dữ liệu'],
    alertStatusColumns: ['Trạng thái tồn âm'],
    importedByColumns: ['Người import']
  },
  lossRows: {
    key: 'lossRows',
    sheetName: SHEET_NAMES.DL_THAT_THOAT_NVL,
    label: 'Thất thoát NVL',
    dateColumns: ['Tuần bắt đầu'],
    weekColumns: ['Mã tuần', 'Tuần', 'Năm'],
    branchColumns: ['Chi nhánh'],
    channelColumns: ['Loại nguyên vật liệu'],
    statusColumns: ['Trạng thái dữ liệu'],
    alertStatusColumns: ['Trạng thái'],
    importedByColumns: ['Người import']
  },
  debt: {
    key: 'debt',
    sheetName: SHEET_NAMES.DL_CONG_NO,
    label: 'Công nợ',
    dateColumns: ['Ngày', 'Đến hạn'],
    weekColumns: ['Mã tuần', 'Tuần'],
    branchColumns: ['Chi nhánh'],
    channelColumns: ['Nhóm công nợ', 'Nhà cung cấp/Đối tượng'],
    statusColumns: ['Trạng thái dữ liệu'],
    alertStatusColumns: ['Cần CEO duyệt', 'Quá hạn'],
    importedByColumns: ['Người import']
  },
  purchase: {
    key: 'purchase',
    sheetName: SHEET_NAMES.DL_THU_MUA,
    label: 'Thu mua',
    dateColumns: ['Ngày'],
    weekColumns: ['Mã tuần', 'Tuần'],
    branchColumns: ['Chi nhánh'],
    channelColumns: ['Mặt hàng', 'NCC'],
    statusColumns: ['Trạng thái dữ liệu'],
    alertStatusColumns: ['Đánh giá'],
    importedByColumns: ['Người import']
  }
};

export const SOURCE_KEYS = Object.keys(SOURCE_CONTRACTS) as SourceKey[];
