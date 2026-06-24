import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GOOGLE_SHEETS_SCHEMA } from '@/lib/google-sheets/schema';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { SOURCE_CONTRACTS, SOURCE_KEYS } from '../source-contract';

vi.mock('@/lib/env/server-env', () => ({
  getServerEnv: () => ({ dataStore: 'local' })
}));

const REQUIRED_SOURCE_SHEETS = [
  SHEET_NAMES.DL_DOANH_THU_APP,
  SHEET_NAMES.DL_DOANH_THU_CUA_HANG,
  SHEET_NAMES.DL_SO_QUY,
  SHEET_NAMES.DL_TON_KHO,
  SHEET_NAMES.DL_THAT_THOAT_NVL,
  SHEET_NAMES.DL_CONG_NO,
  SHEET_NAMES.DL_THU_MUA
];

function base(rowId: string, weekCode: string, date = '2026-06-15') {
  return {
    'Mã dòng dữ liệu': rowId,
    'Mã lần import': `IMP-${rowId}`,
    'Ngày': date,
    'Năm': 2026,
    'Tháng': 6,
    'Tuần': weekCode,
    'Mã tuần': weekCode,
    'Chi nhánh': 'Làng NVT',
    'Tên file nguồn': 'synthetic-v4-8.xlsx',
    'Dấu vết file': `hash-${rowId}`,
    'Dấu vết dòng': `row-${rowId}`,
    'Trạng thái dữ liệu': 'Đã xác nhận',
    'Ngày import': `${date}T00:00:00.000Z`,
    'Người import': 'v4-8-synthetic-test'
  };
}

function createFullData(): Record<string, Record<string, unknown>[]> {
  return {
    [SHEET_NAMES.DL_DOANH_THU_CUA_HANG]: [
      { ...base('store-w25', '2026-W25', '2026-06-15'), 'Ca bán': 'Offline', 'Tổng phần': 100, 'Số hộp': 80, 'Số dĩa': 20, 'Tiền mặt': 2500000, 'MoMo/chuyển khoản': 500000, 'Chi tiền mặt': 0, 'Tổng doanh thu theo file': 3000000, 'Doanh thu bán hàng thực': 3000000, 'Tiền mặt còn lại sau chi': 2500000 },
      { ...base('store-w26', '2026-W26', '2026-06-23'), 'Ca bán': 'Offline', 'Tổng phần': 150, 'Số hộp': 100, 'Số dĩa': 50, 'Tiền mặt': 4000000, 'MoMo/chuyển khoản': 1000000, 'Chi tiền mặt': 0, 'Tổng doanh thu theo file': 5000000, 'Doanh thu bán hàng thực': 5000000, 'Tiền mặt còn lại sau chi': 4000000 }
    ],
    [SHEET_NAMES.DL_DOANH_THU_APP]: [
      { ...base('app-w25', '2026-W25', '2026-06-15'), 'Kênh bán': 'Grab', 'Tài khoản app': 'Grab Làng NVT', 'Doanh thu gộp': 2800000, 'Tổng khấu trừ/phí': 500000, 'Doanh thu ròng': 2300000, 'Số đơn': 90, 'Giá vốn': 950000, 'Giá trị đơn trung bình': 31111, 'Tỷ lệ phí': '17.9%' },
      { ...base('app-w26', '2026-W26', '2026-06-23'), 'Kênh bán': 'ShopeeFood', 'Tài khoản app': 'Shopee Làng NVT', 'Doanh thu gộp': 4000000, 'Tổng khấu trừ/phí': 900000, 'Doanh thu ròng': 3100000, 'Số đơn': 120, 'Giá vốn': 1400000, 'Giá trị đơn trung bình': 33333, 'Tỷ lệ phí': '22.5%' }
    ],
    [SHEET_NAMES.DL_SO_QUY]: [
      { ...base('cash-in-w25', '2026-W25', '2026-06-15'), 'Loại giao dịch': 'Thu', 'Nhóm thu/chi': 'Doanh thu', 'Diễn giải': 'Phiếu thu doanh thu cửa hàng', 'Số tiền': 5200000, 'Phương thức': 'Tiền mặt', 'Số dư sau giao dịch': 5200000, 'Người tạo': 'Kế toán' },
      { ...base('cash-out-w25', '2026-W25', '2026-06-15'), 'Loại giao dịch': 'Chi', 'Nhóm thu/chi': 'Điện/nước/gas', 'Diễn giải': 'Phiếu chi tiền điện nước gas', 'Số tiền': -1200000, 'Phương thức': 'Tiền mặt', 'Số dư sau giao dịch': 4000000, 'Người tạo': 'Kế toán' },
      { ...base('cash-in-w26', '2026-W26', '2026-06-23'), 'Loại giao dịch': 'Thu', 'Nhóm thu/chi': 'Doanh thu', 'Diễn giải': 'Phiếu thu doanh thu cửa hàng', 'Số tiền': 8100000, 'Phương thức': 'Tiền mặt', 'Số dư sau giao dịch': 8100000, 'Người tạo': 'Kế toán' },
      { ...base('cash-ncc-w26', '2026-W26', '2026-06-23'), 'Loại giao dịch': 'Chi', 'Nhóm thu/chi': 'Khác', 'Diễn giải': 'Phiếu chi Tiền trả NCC', 'Số tiền': -13300000, 'Phương thức': 'Chuyển khoản', 'Số dư sau giao dịch': -5200000, 'Người tạo': 'Kế toán' },
      { ...base('cash-capex-w26', '2026-W26', '2026-06-23'), 'Loại giao dịch': 'Chi', 'Nhóm thu/chi': 'Khác', 'Diễn giải': 'Đầu tư nhà xưởng BTT', 'Số tiền': -10500000, 'Phương thức': 'Chuyển khoản', 'Số dư sau giao dịch': -15700000, 'Người tạo': 'Kế toán' }
    ],
    [SHEET_NAMES.DL_TON_KHO]: [
      { ...base('stock-w26', '2026-W26', '2026-06-23'), 'Ngày kiểm kê': '2026-06-23', 'Mã hàng': 'NVL-SUON', 'Tên hàng': 'Sườn cốt lết', 'Nhóm hàng': 'NVL chính', 'Đơn vị tính': 'kg', 'Tồn kho': 25, 'Giá trị tồn': 2500000, 'Trạng thái tồn âm': 'Không', 'Định mức tồn tối thiểu': 10, 'Định mức tồn tối đa': 50 }
    ],
    [SHEET_NAMES.DL_THAT_THOAT_NVL]: [
      { ...base('loss-w26', '2026-W26', '2026-06-23'), 'Tuần bắt đầu': '2026-06-22', 'Tuần kết thúc': '2026-06-28', 'Tên nguyên vật liệu': 'Sườn cốt lết', 'Loại nguyên vật liệu': 'NVL chính', 'Đơn vị tính': 'kg', 'Tồn đầu kỳ': 20, 'Nhập trong kỳ': 50, 'Nhập từ bếp trung tâm': 0, 'Nhập từ nhà cung cấp': 50, 'Tiêu hao lý thuyết theo bán hàng': 42, 'Tồn cuối kỳ lý thuyết': 28, 'Tồn cuối kỳ thực tế': 25, 'Tồn cuối từ sổ': 25, 'Chênh lệch số lượng': -3, 'Loại chênh lệch': 'Thiếu', 'Đơn giá': 100000, 'Giá trị chênh lệch': -300000, 'Tỷ lệ thất thoát': '4.2%', 'Định mức cho phép': '2%', 'Mức vượt định mức': '2.2%', 'Trạng thái': 'Cảnh báo', 'Ghi chú': 'Dữ liệu giả test', 'Nguyên nhân AI đề xuất': '', 'Hành động đề xuất': 'Kiểm kê lại', 'Người phụ trách': 'Kế toán', 'Deadline xử lý': 'Hôm nay' }
    ],
    [SHEET_NAMES.DL_CONG_NO]: [
      { ...base('debt-w26', '2026-W26', '2026-06-23'), 'Nhà cung cấp/Đối tượng': 'NCC thịt', 'Nhóm công nợ': 'Phải trả NCC', 'Phải trả': 20000000, 'Đã trả': 13300000, 'Còn phải trả': 6700000, 'Đến hạn': '2026-06-25', 'Quá hạn': 'Không', 'Cần CEO duyệt': 'Không', 'Ghi chú': 'Đối chiếu khoản trả NCC từ sổ quỹ' }
    ],
    [SHEET_NAMES.DL_THU_MUA]: [
      { ...base('purchase-w26', '2026-W26', '2026-06-23'), 'Mặt hàng': 'Sườn cốt lết', 'NCC': 'NCC thịt', 'Giá tuần trước': 95000, 'Giá tuần này': 100000, 'Chênh lệch giá': 5000, 'Số lượng mua': 50, 'Tác động tiền': 250000, 'Đánh giá': 'Cảnh báo', 'Ghi chú': 'Giá tăng cần kiểm' }
    ],
    [SHEET_NAMES.AUDIT_LOG]: [],
    [SHEET_NAMES.IMPORT_LICH_SU]: [],
    [SHEET_NAMES.CAI_DAT_NGUONG]: []
  };
}

let data = createFullData();

vi.mock('@/lib/data-store', () => ({
  getDataStore: () => ({
    read: async (sheetName: string) => data[sheetName] ?? []
  })
}));

describe('V4.8 synthetic full source QC', () => {
  beforeEach(() => {
    data = createFullData();
  });

  it('keeps source contracts aligned with the Google Sheet schema columns', () => {
    const schemaByName = new Map(GOOGLE_SHEETS_SCHEMA.map((sheet) => [sheet.sheetName, new Set(sheet.columns)]));
    expect(REQUIRED_SOURCE_SHEETS.every((sheetName) => schemaByName.has(sheetName))).toBe(true);

    for (const key of SOURCE_KEYS) {
      const contract = SOURCE_CONTRACTS[key];
      const columns = schemaByName.get(contract.sheetName);
      expect(columns, `Missing schema for ${contract.sheetName}`).toBeTruthy();
      const referencedColumns = [
        ...contract.dateColumns,
        ...contract.weekColumns,
        ...contract.branchColumns,
        ...contract.channelColumns,
        ...contract.statusColumns,
        ...contract.alertStatusColumns,
        ...contract.importedByColumns
      ];
      for (const column of referencedColumns) {
        expect(columns?.has(column), `${contract.sheetName} contract references missing column ${column}`).toBe(true);
      }
    }
  });

  it('uses mocked in-memory rows across all seven source sheets and clears them after each test', async () => {
    const { buildDashboardReport } = await import('../report-aggregator');
    const report = await buildDashboardReport({ weekCode: '2026-W26', branch: 'Làng NVT', source: 'all' });

    expect(report.sourceCounts.storeRevenue).toBe(1);
    expect(report.sourceCounts.appRevenue).toBe(1);
    expect(report.sourceCounts.cashbook).toBe(3);
    expect(report.sourceCounts.inventory).toBe(1);
    expect(report.sourceCounts.lossRows).toBe(1);
    expect(report.sourceCounts.debt).toBe(1);
    expect(report.sourceCounts.purchase).toBe(1);
    expect(report.totals.revenue).toBe(8100000);
    expect(report.totals.cashDebtPaymentOut).toBe(13300000);
    expect(report.totals.cashCapexOut).toBe(10500000);
    expect(report.cashflowTrendRows.some((row) => row[0] === 'Tiền ra' && row[3] !== 'Chưa đủ dữ liệu')).toBe(true);
    expect(report.sourceReadinessRows).toHaveLength(7);
    expect(report.ceoActionRows.length).toBeGreaterThan(0);
  });
});
