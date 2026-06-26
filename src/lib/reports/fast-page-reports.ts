import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { Status } from '@/lib/report-types';
import { calculateBalance } from '@/lib/finance/balance-calculator';
import { calculatePnl } from '@/lib/finance/pl-calculator';
import { analyzeCashbookRows } from './cashbook-analysis';
import { applySourceFilter, isValidImportRow, parseReportFilterFromSearchParams, type ReportFilter } from './report-filters';
import { pickNumber, type DataRow } from './row-normalizers';
import { SOURCE_CONTRACTS, SOURCE_KEYS, type SourceKey } from './source-contract';

type FastKpi = { label: string; value: string; status?: Status };

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
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
  const rowsBySheet = store.readMany
    ? await store.readMany(names)
    : Object.fromEntries(await Promise.all(names.map(async (name) => [name, await store.read(name)] as const)));
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
  counts.storeRevenue = storeRevenue.length;
  counts.appRevenue = appRevenue.length;
  counts.cashbook = cashbook.length;
  counts.lossRows = lossRows.length;
  counts.debt = debt.length;
  counts.purchase = purchase.length;
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
  return {
    sourceCounts: counts,
    hasRealData: Boolean(revenue || cashbook.length || lossRows.length),
    executiveKpis,
    pnlRows: pnl.rows,
    cashbookGroupRows: analysis.groupRows,
    financeEvidenceRows: pnl.evidenceRows,
    financeLimitationRows: pnl.limitations.map((item) => ['P&L', item, 'Ảnh hưởng kết luận lợi nhuận', 'Kế toán rà lại']),
    revenueByChannel: [
      { channel: 'Cửa hàng', revenue: formatMoney(storeSales), value: storeSales },
      { channel: 'App', revenue: formatMoney(appNet), value: appNet }
    ],
    totals: { revenue, cogsPercent: pnl.totals.cogsPercent ?? 0, cashUnclassifiedOut: analysis.unclassifiedOut }
  };
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
  const counts = sourceCount(rows);
  counts.cashbook = cashbook.length;
  counts.debt = debt.length;
  counts.purchase = purchase.length;
  const cashflowRows = [
    ['Dòng tiền', 'Tiền vào', formatMoney(cashIn), '—', '—', cashbook.length ? 'Đạt' : 'Chưa đủ dữ liệu', 'Theo phiếu thu trong sổ quỹ'],
    ['Dòng tiền', 'Tiền ra', formatMoney(cashOut), '—', '—', cashbook.length ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Theo phiếu chi trong sổ quỹ'],
    ['Dòng tiền', 'Dòng tiền tạm', formatMoney(cashEnding), '—', '—', cashEnding < 0 ? 'Cảnh báo' : cashbook.length ? 'Tốt' : 'Chưa đủ dữ liệu', 'Thu - chi'],
    ['Kế toán', 'Chi cần phân loại', formatMoney(analysis.unclassifiedOut), '—', '—', analysis.unclassifiedOut ? 'Cảnh báo' : 'Tốt', 'Rà đơn vị chịu chi/bản chất chi']
  ];
  const executiveKpis: FastKpi[] = [
    { label: 'Tiền vào', value: formatMoney(cashIn), status: cashbook.length ? 'good' : 'neutral' },
    { label: 'Tiền ra', value: formatMoney(cashOut), status: cashbook.length ? 'warning' : 'neutral' },
    { label: 'Dòng tiền tạm', value: formatMoney(cashEnding), status: cashEnding < 0 ? 'danger' : cashbook.length ? 'good' : 'neutral' },
    { label: 'Chi cần phân loại', value: formatMoney(analysis.unclassifiedOut), status: analysis.unclassifiedOut ? 'warning' : 'good' }
  ];
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
  const counts = sourceCount(rows);
  counts.cashbook = cashbook.length;
  counts.inventory = inventory.length;
  counts.lossRows = lossRows.length;
  counts.debt = debt.length;
  counts.purchase = purchase.length;
  const missingSources = [!cashbook.length ? SHEET_NAMES.DL_SO_QUY : '', !inventory.length ? SHEET_NAMES.DL_TON_KHO : '', !lossRows.length ? SHEET_NAMES.DL_THAT_THOAT_NVL : ''].filter(Boolean) as string[];
  const executiveKpis: FastKpi[] = [
    { label: 'Dòng tiền tạm', value: formatMoney(balance.totals.cashNet), status: balance.totals.cashNet < 0 ? 'danger' : cashbook.length ? 'good' : 'neutral' },
    { label: 'Tồn kho', value: formatMoney(balance.totals.inventoryValue), status: balance.totals.negativeStockCount ? 'warning' : inventory.length ? 'good' : 'neutral' },
    { label: 'Thất thoát quy tiền', value: formatMoney(lossValue), status: lossValue ? 'warning' : 'neutral' }
  ];
  return { sourceCounts: counts, missingSources, executiveKpis, totals: { cashEnding: balance.totals.cashNet, inventoryValue: balance.totals.inventoryValue, negativeStockCount: balance.totals.negativeStockCount, lossValue }, balanceRows: balance.rows, financeLimitationRows: balance.limitations.map((item) => ['Cân đối', item, 'Ảnh hưởng chốt báo cáo', 'Kế toán rà lại']) };
}
