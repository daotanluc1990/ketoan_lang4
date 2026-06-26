import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { Status } from '@/lib/report-types';
import { calculateBalance } from '@/lib/finance/balance-calculator';
import { calculatePnl } from '@/lib/finance/pl-calculator';
import { analyzeCashbookRows } from './cashbook-analysis';
import { applySourceFilter, buildFilterOptions, isValidImportRow, parseReportFilterFromSearchParams, type ReportFilter } from './report-filters';
import { pickNumber, pickText, type DataRow } from './row-normalizers';
import { SOURCE_CONTRACTS, SOURCE_KEYS, type SourceKey } from './source-contract';

type FastKpi = { label: string; value: string; hint?: string; trend?: string; status?: Status };

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
}

function emptyCounts() {
  return { storeRevenue: 0, appRevenue: 0, cashbook: 0, inventory: 0, lossRows: 0, debt: 0, purchase: 0, auditRows: 0, importHistory: 0 };
}

function sheetName(key: SourceKey) {
  return SOURCE_CONTRACTS[key].sheetName;
}

async function readSourceRows(keys: SourceKey[]) {
  const store = getDataStore();
  const names = keys.map(sheetName);
  const rowsBySheet = store.readMany ? await store.readMany(names) : Object.fromEntries(await Promise.all(names.map(async (name) => [name, await store.read(name)] as const)));
  return Object.fromEntries(keys.map((key) => [key, rowsBySheet[sheetName(key)] ?? []])) as Record<SourceKey, DataRow[]>;
}

function parseFilter(input: ReportFilter | URLSearchParams | Record<string, string | string[] | undefined> = {}) {
  return input instanceof URLSearchParams || !('fromDate' in input || 'toDate' in input || 'weekCode' in input || 'branch' in input)
    ? parseReportFilterFromSearchParams(input as URLSearchParams | Record<string, string | string[] | undefined>)
    : input as ReportFilter;
}

function sourceCount(rows: Partial<Record<SourceKey, DataRow[]>>) {
  const counts = emptyCounts();
  for (const key of SOURCE_KEYS) counts[key] = (rows[key] ?? []).filter(isValidImportRow).length;
  return counts;
}

function filterRows(rows: Partial<Record<SourceKey, DataRow[]>>, key: SourceKey, filter: ReportFilter) {
  return applySourceFilter(rows[key] ?? [], key, filter);
}

function lossDisplayRows(rows: DataRow[]) {
  return rows
    .map((row) => {
      const name = pickText(row, ['Tên NVL', 'NVL', 'Nguyên vật liệu', 'Mặt hàng']) || 'Chưa rõ NVL';
      const unit = pickText(row, ['ĐVT', 'Đơn vị tính']) || '—';
      const qty = pickNumber(row, ['Chênh lệch SL', 'Chênh lệch', 'Số lượng chênh lệch']);
      const value = Math.abs(pickNumber(row, ['Giá trị chênh lệch', 'Giá trị lệch']));
      const rate = pickNumber(row, ['Tỷ lệ chênh lệch', 'Tỷ lệ', '% lệch']);
      const status = pickText(row, ['Trạng thái']) || (value ? 'Cần kiểm' : 'Tốt');
      const action = pickText(row, ['Hành động', 'Đề xuất xử lý']) || 'Rà kiểm kê/định mức và giải trình';
      return { value, row: [name, unit, String(qty || '—'), formatMoney(value), rate ? formatPercent(rate) : '—', 'Định mức', 'Cần kiểm', status, action] };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((item) => item.row);
}

function sourceReadinessRows(counts: ReturnType<typeof emptyCounts>) {
  return SOURCE_KEYS.map((key) => [SOURCE_CONTRACTS[key].sheetName, SOURCE_CONTRACTS[key].label, `${counts[key]} dòng`, counts[key] ? 'Đạt' : 'Thiếu dữ liệu', counts[key] ? 'Có thể đọc' : 'Cần import/kiểm tra']);
}

export async function buildFastFilterOptions() {
  const rows = await readSourceRows(SOURCE_KEYS);
  return buildFilterOptions(rows);
}

export async function buildFastOverviewReport(input: ReportFilter | URLSearchParams | Record<string, string | string[] | undefined> = {}) {
  const filter = parseFilter(input);
  const rows = await readSourceRows(SOURCE_KEYS);
  const storeRevenue = filterRows(rows, 'storeRevenue', filter);
  const appRevenue = filterRows(rows, 'appRevenue', filter);
  const cashbook = filterRows(rows, 'cashbook', filter);
  const inventory = filterRows(rows, 'inventory', filter);
  const lossRows = filterRows(rows, 'lossRows', filter);
  const debt = filterRows(rows, 'debt', filter);
  const purchase = filterRows(rows, 'purchase', filter);
  const storeSales = storeRevenue.reduce((t, r) => t + pickNumber(r, ['Doanh thu bán hàng thực', 'Tổng doanh thu theo file']), 0);
  const appNet = appRevenue.reduce((t, r) => t + pickNumber(r, ['Doanh thu ròng']), 0);
  const cashIn = cashbook.filter((r) => pickNumber(r, ['Số tiền', 'Giá trị']) > 0).reduce((t, r) => t + pickNumber(r, ['Số tiền', 'Giá trị']), 0);
  const cashOut = Math.abs(cashbook.filter((r) => pickNumber(r, ['Số tiền', 'Giá trị']) < 0).reduce((t, r) => t + pickNumber(r, ['Số tiền', 'Giá trị']), 0));
  const cashEnding = cashIn - cashOut;
  const inventoryValue = inventory.reduce((t, r) => t + pickNumber(r, ['Giá trị tồn', 'Giá trị tồn kho']), 0);
  const lossValue = lossRows.reduce((t, r) => t + Math.abs(pickNumber(r, ['Giá trị chênh lệch', 'Giá trị lệch'])), 0);
  const analysis = analyzeCashbookRows(cashbook, { debt: debt.length, purchase: purchase.length, inventory: inventory.length, lossRows: lossRows.length });
  const counts = sourceCount(rows);
  counts.storeRevenue = storeRevenue.length; counts.appRevenue = appRevenue.length; counts.cashbook = cashbook.length; counts.inventory = inventory.length; counts.lossRows = lossRows.length; counts.debt = debt.length; counts.purchase = purchase.length;
  const missingSources = SOURCE_KEYS.filter((key) => !counts[key]).map((key) => SOURCE_CONTRACTS[key].sheetName);
  const revenue = storeSales + appNet;
  const executiveKpis: FastKpi[] = [
    { label: 'Tổng doanh thu', value: formatMoney(revenue), status: revenue ? 'good' : 'neutral' },
    { label: 'Doanh thu cửa hàng', value: formatMoney(storeSales), status: storeRevenue.length ? 'good' : 'neutral' },
    { label: 'Doanh thu app net', value: formatMoney(appNet), status: appRevenue.length ? 'good' : 'neutral' },
    { label: 'Tiền vào', value: formatMoney(cashIn), status: cashbook.length ? 'good' : 'neutral' },
    { label: 'Tiền ra', value: formatMoney(cashOut), status: cashbook.length ? 'warning' : 'neutral' },
    { label: 'Dòng tiền tạm', value: formatMoney(cashEnding), status: cashEnding < 0 ? 'danger' : cashbook.length ? 'good' : 'neutral' },
    { label: 'Chi cần phân loại', value: formatMoney(analysis.unclassifiedOut), status: analysis.unclassifiedOut ? 'warning' : 'good' },
    { label: 'Tồn kho', value: formatMoney(inventoryValue), status: inventory.length ? 'good' : 'neutral' },
    { label: 'Thất thoát quy tiền', value: formatMoney(lossValue), status: lossValue ? 'warning' : 'neutral' }
  ];
  const issueRows = [...analysis.issueRows, ...(!storeRevenue.length || !appRevenue.length ? [['6', 'Thiếu nguồn doanh thu', 'Không kết luận đủ doanh thu', 'Chưa đủ nguồn cửa hàng/app', 'Import bổ sung']] : [])].slice(0, 6);
  return {
    hasRealData: Boolean(revenue || cashbook.length || inventory.length || lossRows.length),
    missingSources,
    executiveKpis,
    revenueByChannel: [{ channel: 'Cửa hàng', revenue: formatMoney(storeSales), value: storeSales }, { channel: 'App', revenue: formatMoney(appNet), value: appNet }],
    ceoActionRows: analysis.accountingTaskRows.slice(0, 8).map((row, index) => [String(index + 1), row[1] ?? row[0], row[4] ?? 'Cần rà', row[7] ?? row[1] ?? 'Rà dữ liệu', row[2] ?? 'Kế toán']),
    cashbookGroupRows: analysis.groupRows,
    issueRows,
    lossTop5Rows: lossDisplayRows(lossRows),
    sourceReadinessRows: sourceReadinessRows(counts),
    sourceCounts: counts,
    totals: { cashEnding, cashUnclassifiedOut: analysis.unclassifiedOut, lossValue }
  };
}

export async function buildFastLossReport(input: ReportFilter | URLSearchParams | Record<string, string | string[] | undefined> = {}) {
  const filter = parseFilter(input);
  const rows = await readSourceRows(['lossRows']);
  const lossRows = filterRows(rows, 'lossRows', filter);
  const lossTop5Rows = lossDisplayRows(lossRows);
  const lossValue = lossRows.reduce((t, r) => t + Math.abs(pickNumber(r, ['Giá trị chênh lệch', 'Giá trị lệch'])), 0);
  const counts = sourceCount(rows);
  counts.lossRows = lossRows.length;
  return { sourceCounts: counts, executiveKpis: [{ label: 'Thất thoát quy tiền', value: formatMoney(lossValue), status: lossValue ? 'warning' : 'neutral' } as FastKpi], totals: { lossValue }, lossTop5Rows };
}

export async function buildFastWorkbenchReport(input: ReportFilter | URLSearchParams | Record<string, string | string[] | undefined> = {}) {
  const filter = parseFilter(input);
  const rows = await readSourceRows(SOURCE_KEYS);
  const cashbook = filterRows(rows, 'cashbook', filter);
  const debt = filterRows(rows, 'debt', filter);
  const purchase = filterRows(rows, 'purchase', filter);
  const analysis = analyzeCashbookRows(cashbook, { debt: debt.length, purchase: purchase.length, inventory: 0, lossRows: 0 });
  const counts = sourceCount(rows);
  SOURCE_KEYS.forEach((key) => { counts[key] = filterRows(rows, key, filter).length; });
  const missingRequiredSources = ['storeRevenue', 'appRevenue', 'cashbook'].filter((key) => !counts[key as SourceKey]).map((key) => SOURCE_CONTRACTS[key as SourceKey].sheetName);
  const taskRows = [...analysis.accountingTaskRows, ...missingRequiredSources.map((sheet) => ['Cảnh báo', `Import ${sheet}`, sheet, '0 dòng hợp lệ', 'Kế toán', 'Hôm nay', 'Không', 'Bổ sung dữ liệu'])];
  const score = Math.max(0, 100 - missingRequiredSources.length * 18 - (analysis.unclassifiedOut ? 8 : 0));
  const status = missingRequiredSources.length ? 'Cảnh báo' : analysis.unclassifiedOut ? 'Cần kiểm tra' : 'Tốt';
  const dataQuality = { score, status, message: missingRequiredSources.length ? 'Còn thiếu nguồn cần chốt' : 'Nguồn chính đã có dữ liệu', missingRequiredSources };
  const dataQualitySourceRows = sourceReadinessRows(counts).map((row) => [row[0], row[1], row[2], row[3], row[4], row[3] === 'Đạt' ? 'Theo dõi' : 'Import bổ sung']);
  return { dataQuality, accountingWorkbenchTaskRows: taskRows, dataQualitySourceRows, dataQualityMatrixRows: dataQualitySourceRows, cashbookGroupRows: analysis.groupRows, sourceCounts: counts, totals: { cashUnclassifiedOut: analysis.unclassifiedOut } };
}

export async function buildFastPnlReport(input: ReportFilter | URLSearchParams | Record<string, string | string[] | undefined> = {}) {
  const filter = parseFilter(input);
  const rows = await readSourceRows(['storeRevenue', 'appRevenue', 'cashbook', 'lossRows', 'debt', 'purchase']);
  const storeRevenue = filterRows(rows, 'storeRevenue', filter);
  const appRevenue = filterRows(rows, 'appRevenue', filter);
  const cashbook = filterRows(rows, 'cashbook', filter);
  const lossRows = filterRows(rows, 'lossRows', filter);
  const debt = filterRows(rows, 'debt', filter);
  const purchase = filterRows(rows, 'purchase', filter);
  const pnl = calculatePnl({ storeRevenueRows: storeRevenue, appRevenueRows: appRevenue, cashbookRows: cashbook, lossRows, filter });
  const analysis = analyzeCashbookRows(cashbook, { debt: debt.length, purchase: purchase.length, inventory: 0, lossRows: lossRows.length });
  const counts = sourceCount(rows);
  counts.storeRevenue = storeRevenue.length; counts.appRevenue = appRevenue.length; counts.cashbook = cashbook.length; counts.lossRows = lossRows.length; counts.debt = debt.length; counts.purchase = purchase.length;
  const revenue = pnl.totals.revenue;
  const storeSales = pnl.totals.storeSales;
  const appNet = pnl.totals.appNet;
  const lossValue = lossRows.reduce((total, row) => total + Math.abs(pickNumber(row, ['Giá trị chênh lệch'])), 0);
  const executiveKpis: FastKpi[] = [
    { label: 'Tổng doanh thu', value: formatMoney(revenue), status: revenue ? 'good' : 'neutral' },
    { label: 'Doanh thu cửa hàng', value: formatMoney(storeSales), status: storeRevenue.length ? 'good' : 'neutral' },
    { label: 'Doanh thu app net', value: formatMoney(appNet), status: appRevenue.length ? 'good' : 'neutral' },
    { label: 'Tiền ra', value: formatMoney(analysis.operatingOut), status: cashbook.length ? 'warning' : 'neutral' },
    { label: 'Chi cần phân loại', value: formatMoney(analysis.unclassifiedOut), status: analysis.unclassifiedOut ? 'warning' : 'good' },
    { label: 'Thất thoát quy tiền', value: formatMoney(lossValue), status: lossValue ? 'warning' : 'neutral' }
  ];
  return { sourceCounts: counts, hasRealData: Boolean(revenue || cashbook.length || lossRows.length), executiveKpis, pnlRows: pnl.rows, cashbookGroupRows: analysis.groupRows, financeEvidenceRows: pnl.evidenceRows, financeLimitationRows: pnl.limitations.map((item) => ['P&L', item, 'Ảnh hưởng kết luận lợi nhuận', 'Kế toán rà lại']), revenueByChannel: [{ channel: 'Cửa hàng', revenue: formatMoney(storeSales), value: storeSales }, { channel: 'App', revenue: formatMoney(appNet), value: appNet }], totals: { revenue, cogsPercent: pnl.totals.cogsPercent ?? 0, cashUnclassifiedOut: analysis.unclassifiedOut } };
}

export async function buildFastCashflowReport(input: ReportFilter | URLSearchParams | Record<string, string | string[] | undefined> = {}) {
  const filter = parseFilter(input);
  const rows = await readSourceRows(['cashbook', 'debt', 'purchase']);
  const cashbook = filterRows(rows, 'cashbook', filter);
  const debt = filterRows(rows, 'debt', filter);
  const purchase = filterRows(rows, 'purchase', filter);
  const cashIn = cashbook.filter((row) => pickNumber(row, ['Số tiền', 'Giá trị']) > 0).reduce((total, row) => total + pickNumber(row, ['Số tiền', 'Giá trị']), 0);
  const cashOut = Math.abs(cashbook.filter((row) => pickNumber(row, ['Số tiền', 'Giá trị']) < 0).reduce((total, row) => total + pickNumber(row, ['Số tiền', 'Giá trị']), 0));
  const cashEnding = cashIn - cashOut;
  const analysis = analyzeCashbookRows(cashbook, { debt: debt.length, purchase: purchase.length, inventory: 0, lossRows: 0 });
  const counts = sourceCount(rows); counts.cashbook = cashbook.length; counts.debt = debt.length; counts.purchase = purchase.length;
  const cashflowRows = [['Dòng tiền', 'Tiền vào', formatMoney(cashIn), '—', '—', cashbook.length ? 'Đạt' : 'Chưa đủ dữ liệu', 'Theo phiếu thu trong sổ quỹ'], ['Dòng tiền', 'Tiền ra', formatMoney(cashOut), '—', '—', cashbook.length ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Theo phiếu chi trong sổ quỹ'], ['Dòng tiền', 'Dòng tiền tạm', formatMoney(cashEnding), '—', '—', cashEnding < 0 ? 'Cảnh báo' : cashbook.length ? 'Tốt' : 'Chưa đủ dữ liệu', 'Thu - chi'], ['Kế toán', 'Chi cần phân loại', formatMoney(analysis.unclassifiedOut), '—', '—', analysis.unclassifiedOut ? 'Cảnh báo' : 'Tốt', 'Rà đơn vị chịu chi/bản chất chi']];
  const executiveKpis: FastKpi[] = [{ label: 'Tiền vào', value: formatMoney(cashIn), status: cashbook.length ? 'good' : 'neutral' }, { label: 'Tiền ra', value: formatMoney(cashOut), status: cashbook.length ? 'warning' : 'neutral' }, { label: 'Dòng tiền tạm', value: formatMoney(cashEnding), status: cashEnding < 0 ? 'danger' : cashbook.length ? 'good' : 'neutral' }, { label: 'Chi cần phân loại', value: formatMoney(analysis.unclassifiedOut), status: analysis.unclassifiedOut ? 'warning' : 'good' }];
  return { sourceCounts: counts, executiveKpis, totals: { cashEnding, cashUnclassifiedOut: analysis.unclassifiedOut }, cashflowRows, cashbookGroupRows: analysis.groupRows, cashbookLargeExpenseRows: analysis.largeExpenseRows };
}

export async function buildFastBalanceReport(input: ReportFilter | URLSearchParams | Record<string, string | string[] | undefined> = {}) {
  const filter = parseFilter(input);
  const rows = await readSourceRows(['cashbook', 'inventory', 'lossRows', 'debt', 'purchase']);
  const cashbook = filterRows(rows, 'cashbook', filter);
  const inventory = filterRows(rows, 'inventory', filter);
  const lossRows = filterRows(rows, 'lossRows', filter);
  const debt = filterRows(rows, 'debt', filter);
  const purchase = filterRows(rows, 'purchase', filter);
  const balance = calculateBalance({ cashbookRows: cashbook, inventoryRows: inventory, debtRows: debt, purchaseRows: purchase, filter });
  const lossValue = lossRows.reduce((total, row) => total + Math.abs(pickNumber(row, ['Giá trị chênh lệch'])), 0);
  const counts = sourceCount(rows); counts.cashbook = cashbook.length; counts.inventory = inventory.length; counts.lossRows = lossRows.length; counts.debt = debt.length; counts.purchase = purchase.length;
  const missingSources = [!cashbook.length ? SHEET_NAMES.DL_SO_QUY : '', !inventory.length ? SHEET_NAMES.DL_TON_KHO : '', !lossRows.length ? SHEET_NAMES.DL_THAT_THOAT_NVL : ''].filter(Boolean) as string[];
  const executiveKpis: FastKpi[] = [{ label: 'Dòng tiền tạm', value: formatMoney(balance.totals.cashNet), status: balance.totals.cashNet < 0 ? 'danger' : cashbook.length ? 'good' : 'neutral' }, { label: 'Tồn kho', value: formatMoney(balance.totals.inventoryValue), status: balance.totals.negativeStockCount ? 'warning' : inventory.length ? 'good' : 'neutral' }, { label: 'Thất thoát quy tiền', value: formatMoney(lossValue), status: lossValue ? 'warning' : 'neutral' }];
  return { sourceCounts: counts, missingSources, executiveKpis, totals: { cashEnding: balance.totals.cashNet, inventoryValue: balance.totals.inventoryValue, negativeStockCount: balance.totals.negativeStockCount, lossValue }, balanceRows: balance.rows, financeLimitationRows: balance.limitations.map((item) => ['Cân đối', item, 'Ảnh hưởng chốt báo cáo', 'Kế toán rà lại']) };
}
