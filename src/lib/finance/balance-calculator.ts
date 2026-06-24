import type { ReportFilter } from '@/lib/reports/report-filters';
import { pickNumber, type DataRow } from '@/lib/reports/row-normalizers';
import { evidenceToRow, formatMoney, makeEvidence, periodLabel } from './formula-evidence';
import type { BalanceCalculationResult, DataStatus } from './finance-types';
import { classifyCashExpenses, sumExpenseBucket } from './expense-classifier';

export type BalanceCalculationInput = {
  cashbookRows: DataRow[];
  inventoryRows: DataRow[];
  debtRows: DataRow[];
  purchaseRows: DataRow[];
  filter?: ReportFilter;
};

function sum(rows: DataRow[], columns: string[]) {
  return rows.reduce((total, row) => total + pickNumber(row, columns), 0);
}

function status(hasCash: boolean, hasInventory: boolean, hasDebt: boolean): DataStatus {
  if (hasCash && hasInventory && hasDebt) return 'complete';
  if (hasCash || hasInventory || hasDebt) return 'partial';
  return 'missing';
}

export function calculateBalance(input: BalanceCalculationInput): BalanceCalculationResult {
  const { cashbookRows, inventoryRows, debtRows, purchaseRows, filter } = input;
  const period = periodLabel(filter?.weekCode, filter?.fromDate, filter?.toDate);
  const cashIn = cashbookRows.filter((row) => pickNumber(row, ['Số tiền', 'Giá trị']) > 0).reduce((total, row) => total + pickNumber(row, ['Số tiền', 'Giá trị']), 0);
  const cashOut = Math.abs(cashbookRows.filter((row) => pickNumber(row, ['Số tiền', 'Giá trị']) < 0).reduce((total, row) => total + pickNumber(row, ['Số tiền', 'Giá trị']), 0));
  const cashNet = cashIn - cashOut;
  const inventoryValue = sum(inventoryRows, ['Giá trị tồn', 'Giá trị tồn kho']);
  const negativeStockCount = inventoryRows.filter((row) => pickNumber(row, ['Tồn kho', 'Tồn kho hiện tại']) < 0).length;
  const payable = sum(debtRows, ['Phải trả']);
  const paidDebt = sum(debtRows, ['Đã trả']);
  const remainingDebt = sum(debtRows, ['Còn phải trả']);
  const purchaseImpact = sum(purchaseRows, ['Tác động tiền']);
  const classifiedExpenses = classifyCashExpenses(cashbookRows);
  const capexOut = sumExpenseBucket(classifiedExpenses, ['capex']);
  const debtPaymentOut = sumExpenseBucket(classifiedExpenses, ['debt_payment']);

  const hasCash = cashbookRows.length > 0;
  const hasInventory = inventoryRows.length > 0;
  const hasDebt = debtRows.length > 0;
  const limitations: string[] = [];
  if (!hasCash) limitations.push('Thiếu DL_SO_QUY nên chưa có tiền vào/ra.');
  if (!hasInventory) limitations.push('Thiếu DL_TON_KHO nên chưa có giá trị tồn kho.');
  if (!hasDebt) limitations.push('Thiếu DL_CONG_NO nên chưa đối chiếu trả NCC và số còn phải trả.');
  if (debtPaymentOut > 0 && !hasDebt) limitations.push('Sổ quỹ có trả NCC nhưng chưa có công nợ để đối chiếu.');
  if (capexOut > 0) limitations.push('Sổ quỹ có capex/đầu tư; cần CEO xác nhận để theo dõi riêng khỏi chi phí vận hành.');
  if (!purchaseRows.length) limitations.push('Thiếu DL_THU_MUA nên chưa giải thích biến động giá/mua hàng.');

  const evidences = [
    makeEvidence({ metric: 'Tiền tạm tính', source: 'DL_SO_QUY', rowCount: cashbookRows.length, formula: 'SUM(phiếu thu) - ABS(SUM(phiếu chi))', period, status: hasCash ? 'complete' : 'missing', note: hasCash ? 'Là dòng tiền theo sổ quỹ, chưa phải số dư ngân hàng đã đối chiếu.' : 'Cần import sổ quỹ.' }),
    makeEvidence({ metric: 'Tồn kho', source: 'DL_TON_KHO', rowCount: inventoryRows.length, formula: 'SUM(Giá trị tồn)', period, status: hasInventory ? 'complete' : 'missing', note: hasInventory ? `${negativeStockCount} mặt hàng tồn âm.` : 'Cần import tồn kho.' }),
    makeEvidence({ metric: 'Công nợ phải trả', source: 'DL_CONG_NO', rowCount: debtRows.length, formula: 'SUM(Còn phải trả)', period, status: hasDebt ? 'complete' : 'missing', note: hasDebt ? 'Dùng đối chiếu tiền trả NCC trong sổ quỹ.' : 'Cần import công nợ.' }),
    makeEvidence({ metric: 'Capex/đầu tư', source: 'DL_SO_QUY', rowCount: cashbookRows.length, formula: 'SUM(phiếu chi được phân loại Đầu tư/Capex)', period, status: capexOut ? 'needs_review' : hasCash ? 'complete' : 'missing', note: capexOut ? 'Cần CEO duyệt phân loại capex.' : 'Không phát hiện capex trong phạm vi lọc.' }),
    makeEvidence({ metric: 'Tác động giá thu mua', source: 'DL_THU_MUA', rowCount: purchaseRows.length, formula: 'SUM(Tác động tiền)', period, status: purchaseRows.length ? 'needs_review' : 'missing', note: purchaseRows.length ? 'Dùng giải thích biến động chi mua hàng.' : 'Chưa có dữ liệu thu mua.' })
  ];

  const rows = [
    ['Tài sản ngắn hạn', 'Tiền tạm tính', hasCash ? formatMoney(cashNet) : 'Chưa đủ dữ liệu', '—', '—', hasCash ? (cashNet < 0 ? 'Cảnh báo' : 'Tốt') : 'Chưa đủ dữ liệu', 'Từ sổ quỹ: thu - chi'],
    ['Tài sản ngắn hạn', 'Tồn kho', hasInventory ? formatMoney(inventoryValue) : 'Chưa đủ dữ liệu', '—', '—', negativeStockCount ? 'Cảnh báo' : hasInventory ? 'Tốt' : 'Chưa đủ dữ liệu', `${negativeStockCount} mặt hàng tồn âm`],
    ['Công nợ', 'Phải trả', hasDebt ? formatMoney(payable) : 'Chưa đủ dữ liệu', '—', '—', hasDebt ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Từ DL_CONG_NO'],
    ['Công nợ', 'Đã trả', hasDebt ? formatMoney(paidDebt) : 'Chưa đủ dữ liệu', '—', '—', hasDebt ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Từ DL_CONG_NO'],
    ['Công nợ', 'Còn phải trả', hasDebt ? formatMoney(remainingDebt) : 'Chưa đủ dữ liệu', '—', '—', remainingDebt > 0 ? 'Cảnh báo' : hasDebt ? 'Tốt' : 'Chưa đủ dữ liệu', 'Đối chiếu với trả NCC trong sổ quỹ'],
    ['Công nợ', 'Tiền trả NCC/công nợ từ sổ quỹ', hasCash ? formatMoney(debtPaymentOut) : 'Chưa đủ dữ liệu', '—', '—', debtPaymentOut && !hasDebt ? 'Cần đối chiếu' : hasCash ? 'Tốt' : 'Chưa đủ dữ liệu', hasDebt ? 'Có DL_CONG_NO để đối chiếu' : 'Chưa có DL_CONG_NO'],
    ['Tài sản/Capex', 'Chi đầu tư/capex từ sổ quỹ', hasCash ? formatMoney(capexOut) : 'Chưa đủ dữ liệu', '—', '—', capexOut ? 'Cần CEO duyệt' : hasCash ? 'Tốt' : 'Chưa đủ dữ liệu', 'Không đưa thẳng vào P&L tuần'],
    ['Thu mua', 'Tác động giá thu mua', purchaseRows.length ? formatMoney(purchaseImpact) : 'Chưa đủ dữ liệu', '—', '—', purchaseRows.length ? 'Cần kiểm' : 'Chưa đủ dữ liệu', 'Từ DL_THU_MUA'],
  ];

  return {
    rows,
    evidenceRows: evidences.map(evidenceToRow),
    limitations,
    status: status(hasCash, hasInventory, hasDebt),
    totals: { cashNet, inventoryValue, negativeStockCount, payable, paidDebt, remainingDebt, capexOut, debtPaymentOut }
  };
}
