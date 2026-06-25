import type { ReportFilter } from '@/lib/reports/report-filters';
import { normalizeText, pickNumber, pickText, type DataRow } from '@/lib/reports/row-normalizers';
import { classifyCashExpenses, sumExpenseBucket } from './expense-classifier';
import { evidenceToRow, formatMoney, formatPercent, makeEvidence, periodLabel } from './formula-evidence';
import type { DataStatus, PnlCalculationResult } from './finance-types';

export type PnlCalculationInput = {
  storeRevenueRows: DataRow[];
  appRevenueRows: DataRow[];
  cashbookRows: DataRow[];
  lossRows: DataRow[];
  filter?: ReportFilter;
};

function sum(rows: DataRow[], columns: string[]) {
  return rows.reduce((total, row) => total + pickNumber(row, columns), 0);
}

function rowStatus(condition: boolean, partial = false) {
  if (condition) return partial ? 'Dữ liệu một phần' : 'Đủ dữ liệu';
  return 'Chưa đủ dữ liệu';
}

function resultStatus(hasRevenue: boolean, hasCashbook: boolean, hasKnownCogs: boolean): DataStatus {
  if (hasRevenue && hasCashbook && hasKnownCogs) return 'complete';
  if (hasRevenue || hasCashbook || hasKnownCogs) return 'partial';
  return 'missing';
}

function isCentralKitchenCashbookRow(row: DataRow) {
  const text = normalizeText(`${pickText(row, ['Khu vực'])} ${pickText(row, ['Chi nhánh'])} ${pickText(row, ['Phân loại P&L'])} ${pickText(row, ['Diễn giải'])} ${pickText(row, ['Ghi chú'])}`);
  return text.includes('bep trung tam') || text.includes('bếp trung tâm') || text.includes('chi nhanh trung tam') || text.includes('chi nhánh trung tâm') || text.includes('chi bep trung tam') || text.includes('chi bếp trung tâm');
}

export function calculatePnl(input: PnlCalculationInput): PnlCalculationResult {
  const { storeRevenueRows, appRevenueRows, cashbookRows, lossRows, filter } = input;
  const period = periodLabel(filter?.weekCode, filter?.fromDate, filter?.toDate);
  const storeSales = sum(storeRevenueRows, ['Doanh thu bán hàng thực', 'Tổng doanh thu theo file']);
  const appNet = sum(appRevenueRows, ['Doanh thu ròng']);
  const appGross = sum(appRevenueRows, ['Doanh thu gộp']);
  const appFees = sum(appRevenueRows, ['Tổng khấu trừ/phí']);
  const appCogs = sum(appRevenueRows, ['Giá vốn']);
  const lossValue = lossRows.reduce((total, row) => total + Math.abs(pickNumber(row, ['Giá trị chênh lệch'])), 0);
  const revenue = storeSales + appNet;

  const centralKitchenCashbookRows = cashbookRows.filter(isCentralKitchenCashbookRow);
  const storeCashbookRows = cashbookRows.filter((row) => !isCentralKitchenCashbookRow(row));
  const centralKitchenExpenses = Math.abs(centralKitchenCashbookRows.filter((row) => pickNumber(row, ['Số tiền', 'Giá trị']) < 0).reduce((total, row) => total + pickNumber(row, ['Số tiền', 'Giá trị']), 0));
  const classifiedExpenses = classifyCashExpenses(storeCashbookRows);
  const operatingExpenses = sumExpenseBucket(classifiedExpenses, ['operating', 'review']);
  const excludedCashOut = sumExpenseBucket(classifiedExpenses, ['debt_payment', 'capex', 'unclassified']);
  const knownCogs = appCogs + lossValue;

  const hasRevenue = storeRevenueRows.length > 0 || appRevenueRows.length > 0;
  const hasKnownCogs = appRevenueRows.length > 0 || lossRows.length > 0;
  const hasCashbook = cashbookRows.length > 0;
  const grossProfit = hasRevenue && hasKnownCogs ? revenue - knownCogs : null;
  const netProfit = grossProfit !== null && hasCashbook ? grossProfit - operatingExpenses : null;
  const appFeePercent = appGross ? appFees / appGross : 0;
  const cogsPercent = revenue && hasKnownCogs ? knownCogs / revenue : null;

  const limitations: string[] = [];
  if (!storeRevenueRows.length) limitations.push('Thiếu DL_DOANH_THU_CUA_HANG nên chưa kết luận doanh thu offline.');
  if (!appRevenueRows.length) limitations.push('Thiếu DL_DOANH_THU_APP nên chưa kết luận doanh thu app/phí app/giá vốn app.');
  if (!cashbookRows.length) limitations.push('Thiếu DL_SO_QUY nên chưa kết luận chi phí vận hành và dòng tiền.');
  if (!lossRows.length) limitations.push('Thiếu DL_THAT_THOAT_NVL nên chưa đưa thất thoát NVL vào P&L.');
  if (storeRevenueRows.length && !appRevenueRows.length) limitations.push('Có doanh thu cửa hàng nhưng chưa có giá vốn cửa hàng; lợi nhuận gộp chỉ được tính khi có nguồn giá vốn đủ tin cậy.');
  if (excludedCashOut > 0) limitations.push('Có khoản trả NCC/capex/khác chưa phân loại bị loại khỏi chi phí vận hành cho đến khi kế toán đối chiếu.');
  if (centralKitchenExpenses > 0) limitations.push('Chi Bếp Trung Tâm được thể hiện riêng, không trộn vào chi phí vận hành của cửa hàng.');

  const evidences = [
    makeEvidence({
      metric: 'Doanh thu cửa hàng',
      source: 'DL_DOANH_THU_CUA_HANG',
      rowCount: storeRevenueRows.length,
      formula: 'SUM(Doanh thu bán hàng thực hoặc Tổng doanh thu theo file)',
      period,
      status: storeRevenueRows.length ? 'complete' : 'missing',
      note: storeRevenueRows.length ? 'Đã lọc theo bộ lọc hiện tại.' : 'Cần import doanh thu cửa hàng.'
    }),
    makeEvidence({
      metric: 'Doanh thu app net',
      source: 'DL_DOANH_THU_APP',
      rowCount: appRevenueRows.length,
      formula: 'SUM(Doanh thu ròng)',
      period,
      status: appRevenueRows.length ? 'complete' : 'missing',
      note: appRevenueRows.length ? 'Doanh thu sau phí app.' : 'Cần import doanh thu app.'
    }),
    makeEvidence({
      metric: 'Giá vốn biết được',
      source: 'DL_DOANH_THU_APP + DL_THAT_THOAT_NVL',
      rowCount: appRevenueRows.length + lossRows.length,
      formula: 'SUM(Giá vốn app) + ABS(SUM(Giá trị chênh lệch NVL))',
      period,
      status: hasKnownCogs ? 'partial' : 'missing',
      note: hasKnownCogs ? 'Chưa bao gồm giá vốn cửa hàng nếu nguồn không có.' : 'Cần nguồn giá vốn/thất thoát.'
    }),
    makeEvidence({
      metric: 'Chi phí vận hành từ sổ quỹ',
      source: 'DL_SO_QUY',
      rowCount: storeCashbookRows.length,
      formula: 'SUM(phiếu chi vận hành cửa hàng) - loại trừ trả NCC/capex/khác chưa phân loại; không trộn chi Bếp Trung Tâm',
      period,
      status: hasCashbook ? 'needs_review' : 'missing',
      note: hasCashbook ? 'Cần kế toán rà lại nhóm chi chưa rõ bản chất.' : 'Cần import sổ quỹ.'
    }),
    makeEvidence({
      metric: 'Lợi nhuận ròng tạm',
      source: 'Bộ máy P&L',
      rowCount: storeRevenueRows.length + appRevenueRows.length + cashbookRows.length + lossRows.length,
      formula: 'Doanh thu - Giá vốn biết được - Chi phí vận hành cửa hàng tạm',
      period,
      status: netProfit === null ? 'missing' : hasKnownCogs ? 'partial' : 'missing',
      note: netProfit === null ? 'Không tính nếu thiếu doanh thu/giá vốn/chi phí.' : 'Chỉ là tạm nếu còn thiếu giá vốn cửa hàng hoặc khoản chưa phân loại.'
    })
  ];

  const rows = [
    ['Doanh thu', 'Doanh thu cửa hàng', storeRevenueRows.length ? formatMoney(storeSales) : 'Chưa đủ dữ liệu', '—', '—', '—', rowStatus(storeRevenueRows.length > 0)],
    ['Doanh thu', 'Doanh thu app net', appRevenueRows.length ? formatMoney(appNet) : 'Chưa đủ dữ liệu', '—', '—', '—', rowStatus(appRevenueRows.length > 0)],
    ['Doanh thu', 'Tổng doanh thu đủ nguồn hiện có', hasRevenue ? formatMoney(revenue) : 'Chưa đủ dữ liệu', '—', '—', '—', hasRevenue ? (storeRevenueRows.length && appRevenueRows.length ? 'Đủ dữ liệu' : 'Dữ liệu một phần') : 'Chưa đủ dữ liệu'],
    ['Giá vốn', 'Giá vốn app', appRevenueRows.length ? formatMoney(appCogs) : 'Chưa đủ dữ liệu', '—', '—', revenue ? formatPercent(appCogs / revenue) : '—', appRevenueRows.length ? 'Cần kiểm' : 'Chưa đủ dữ liệu'],
    ['Giá vốn', 'Thất thoát NVL quy tiền', lossRows.length ? formatMoney(lossValue) : 'Chưa đủ dữ liệu', '—', '—', revenue ? formatPercent(lossValue / revenue) : '—', lossRows.length ? 'Cảnh báo' : 'Chưa đủ dữ liệu'],
    ['Chi phí', 'Chi phí vận hành cửa hàng từ sổ quỹ', hasCashbook ? formatMoney(operatingExpenses) : 'Chưa đủ dữ liệu', '—', '—', revenue ? formatPercent(operatingExpenses / revenue) : '—', hasCashbook ? 'Cần kiểm' : 'Chưa đủ dữ liệu'],
    ['Chi phí', 'Chi Bếp Trung Tâm theo dõi riêng', centralKitchenExpenses ? formatMoney(centralKitchenExpenses) : 'Không có', '—', '—', '—', centralKitchenExpenses ? 'Theo dõi riêng' : 'Không có'],
    ['Loại trừ', 'Không đưa thẳng vào P&L: trả NCC/capex/khác', hasCashbook ? formatMoney(excludedCashOut) : 'Chưa đủ dữ liệu', '—', '—', '—', excludedCashOut ? 'Cần đối chiếu' : hasCashbook ? 'Tốt' : 'Chưa đủ dữ liệu'],
    ['Lợi nhuận', 'Lợi nhuận gộp tạm', grossProfit !== null ? formatMoney(grossProfit) : 'Chưa đủ dữ liệu', '—', '—', cogsPercent !== null ? formatPercent(cogsPercent) : '—', grossProfit !== null ? 'Dữ liệu một phần' : 'Chưa đủ dữ liệu'],
    ['Lợi nhuận', 'Lợi nhuận ròng tạm', netProfit !== null ? formatMoney(netProfit) : 'Chưa đủ dữ liệu', '—', '—', revenue && netProfit !== null ? formatPercent(netProfit / revenue) : '—', netProfit !== null ? 'Dữ liệu một phần' : 'Chưa đủ dữ liệu'],
    ['Tỷ lệ', 'App fee%', appRevenueRows.length ? formatPercent(appFeePercent) : 'Chưa đủ dữ liệu', '—', '—', '—', appFeePercent > 0.45 ? 'Nguy hiểm' : appFeePercent > 0.35 ? 'Cảnh báo' : appRevenueRows.length ? 'Tốt' : 'Chưa đủ dữ liệu'],
    ['Tỷ lệ', 'COGS% biết được', cogsPercent !== null ? formatPercent(cogsPercent) : 'Chưa đủ dữ liệu', '—', '—', '—', cogsPercent !== null ? (cogsPercent > 0.47 ? 'Nguy hiểm' : cogsPercent > 0.43 ? 'Cảnh báo' : 'Tốt') : 'Chưa đủ dữ liệu']
  ];

  return {
    rows,
    evidenceRows: evidences.map(evidenceToRow),
    limitations,
    status: resultStatus(hasRevenue, hasCashbook, hasKnownCogs),
    totals: {
      revenue,
      storeSales,
      appNet,
      appGross,
      appFees,
      appCogs,
      knownCogs,
      operatingExpenses,
      excludedCashOut,
      grossProfit,
      netProfit,
      appFeePercent,
      cogsPercent
    }
  };
}
