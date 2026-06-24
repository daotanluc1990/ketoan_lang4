import { normalizeText, pickNumber, pickText, toIsoDate, toText, type DataRow } from './row-normalizers';

export type CashbookRelatedCounts = {
  debt: number;
  purchase: number;
  inventory: number;
  lossRows: number;
};

export type CashbookAnalysis = {
  groupRows: string[][];
  largeExpenseRows: string[][];
  accountingTaskRows: string[][];
  issueRows: string[][];
  largeExpenseCount: number;
  unclassifiedOut: number;
  nccPaymentOut: number;
  capexOut: number;
  operatingOut: number;
};

type ClassifiedExpense = {
  row: DataRow;
  amount: number;
  category: string;
  status: string;
  action: string;
};

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

export function classifyCashbookExpense(row: DataRow) {
  const description = normalizeText(`${pickText(row, ['Diễn giải'])} ${pickText(row, ['Nhóm thu/chi'])} ${pickText(row, ['Người tạo'])}`);
  const originalGroup = pickText(row, ['Nhóm thu/chi']);

  if (includesAny(description, ['trả ncc', 'tra ncc', 'nhà cung cấp', 'nha cung cap', 'công nợ', 'cong no', 'thanh toán ncc', 'thanh toan ncc'])) {
    return { category: 'Trả NCC/công nợ', status: 'Cần đối chiếu', action: 'Đối chiếu với DL_CONG_NO trước khi đưa vào P&L' };
  }

  if (includesAny(description, ['đầu tư', 'dau tu', 'nhà xưởng', 'nha xuong', 'máy móc', 'may moc', 'thiết bị', 'thiet bi', 'xây dựng', 'xay dung'])) {
    return { category: 'Đầu tư/Capex', status: 'Cần CEO duyệt', action: 'Tách khỏi chi phí vận hành, theo dõi ở cân đối/capex' };
  }

  if (includesAny(description, ['thuê mặt bằng', 'thue mat bang', 'mặt bằng', 'mat bang', 'tiền thuê', 'tien thue'])) {
    return { category: 'Thuê mặt bằng', status: 'Cần kiểm', action: 'Kiểm tra đúng kỳ thuê và tránh ghi trùng' };
  }

  if (includesAny(description, ['điện', 'dien', 'nước', 'nuoc', 'gas'])) {
    return { category: 'Điện/nước/gas', status: 'Tốt', action: 'Theo dõi xu hướng tuần/tháng' };
  }

  if (includesAny(description, ['rau', 'củ', 'cu', 'đồ chua', 'do chua', 'gạo', 'gao', 'thịt', 'thit', 'sườn', 'suon', 'nvl', 'nguyên liệu', 'nguyen lieu', 'hộp', 'hop'])) {
    return { category: 'Mua NVL/bao bì', status: 'Cần đối chiếu', action: 'Đối chiếu với DL_THU_MUA, DL_TON_KHO và thất thoát' };
  }

  if (includesAny(description, ['sửa chữa', 'sua chua', 'bảo trì', 'bao tri'])) {
    return { category: 'Sửa chữa/bảo trì', status: 'Cần kiểm', action: 'Kiểm tra phát sinh bất thường và hóa đơn' };
  }

  if (includesAny(description, ['lương', 'luong', 'nhân sự', 'nhan su', 'parttime', 'part time', 'fulltime', 'full time'])) {
    return { category: 'Nhân sự', status: 'Cần kiểm', action: 'Đối chiếu bảng công/lương trước khi đưa vào P&L' };
  }

  if (originalGroup && normalizeText(originalGroup) !== 'khac') {
    return { category: originalGroup, status: 'Tốt', action: 'Theo dõi theo nhóm sổ quỹ' };
  }

  return { category: 'Khác cần phân loại', status: 'Cảnh báo', action: 'Kế toán phân loại lại bằng diễn giải/hóa đơn' };
}

function getExpenseDescription(row: DataRow) {
  return pickText(row, ['Diễn giải']) || pickText(row, ['Người tạo']) || 'Không có diễn giải';
}

export function analyzeCashbookRows(rows: DataRow[], relatedCounts: CashbookRelatedCounts): CashbookAnalysis {
  const expenses: ClassifiedExpense[] = rows
    .map((row) => ({ row, amount: pickNumber(row, ['Số tiền', 'Giá trị']) }))
    .filter(({ amount }) => amount < 0)
    .map(({ row, amount }) => ({ row, amount: Math.abs(amount), ...classifyCashbookExpense(row) }));

  const totalOut = expenses.reduce((total, item) => total + item.amount, 0);
  const byCategory = new Map<string, { amount: number; count: number; status: string; action: string }>();

  for (const item of expenses) {
    const current = byCategory.get(item.category) ?? { amount: 0, count: 0, status: item.status, action: item.action };
    current.amount += item.amount;
    current.count += 1;
    if (['Cảnh báo', 'Cần CEO duyệt', 'Cần đối chiếu'].includes(item.status)) current.status = item.status;
    byCategory.set(item.category, current);
  }

  const groupRows = Array.from(byCategory.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([category, value]) => [
      'Sổ quỹ',
      `Chi nhóm ${category}`,
      formatMoney(value.amount),
      '—',
      totalOut ? formatPercent(value.amount / totalOut) : '—',
      value.status,
      `${value.count} dòng · ${value.action}`
    ]);

  const largeThreshold = Math.max(3_000_000, totalOut * 0.05);
  const largeExpenses = expenses
    .filter((item) => item.amount >= largeThreshold)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const largeExpenseRows = largeExpenses.map((item) => [
    toIsoDate(pickText(item.row, ['Ngày'])) || '—',
    pickText(item.row, ['Mã tuần', 'Tuần']) || '—',
    pickText(item.row, ['Chi nhánh']) || '—',
    item.category,
    getExpenseDescription(item.row),
    formatMoney(item.amount),
    item.status,
    item.action
  ]);

  const unclassifiedOut = byCategory.get('Khác cần phân loại')?.amount ?? 0;
  const nccPaymentOut = byCategory.get('Trả NCC/công nợ')?.amount ?? 0;
  const capexOut = byCategory.get('Đầu tư/Capex')?.amount ?? 0;
  const operatingOut = totalOut - nccPaymentOut - capexOut - unclassifiedOut;

  const accountingTaskRows: string[][] = [];
  const issueRows: string[][] = [];

  if (unclassifiedOut > 0) {
    accountingTaskRows.push(['Cảnh báo', 'Phân loại lại nhóm Khác trong sổ quỹ', 'Kế toán', 'Hôm nay', `${formatMoney(unclassifiedOut)} đang chưa đủ rõ bản chất`]);
    issueRows.push(['1', 'Nhóm Khác/cần phân loại trong sổ quỹ cao', formatMoney(unclassifiedOut), 'Diễn giải chưa đủ để tách chi phí/trả nợ/capex', 'Kế toán phân loại lại trước khi chốt P&L']);
  }

  if (nccPaymentOut > 0) {
    accountingTaskRows.push(['Cần đối chiếu', 'Đối chiếu tiền trả NCC với công nợ', 'Kế toán', 'Hôm nay', relatedCounts.debt ? 'Đã có DL_CONG_NO để đối chiếu' : 'Chưa có DL_CONG_NO, chưa kết luận là chi phí tuần']);
    if (!relatedCounts.debt) issueRows.push(['2', 'Tiền trả NCC chưa có bảng công nợ đối chiếu', formatMoney(nccPaymentOut), 'Sổ quỹ chỉ cho biết tiền đã ra, chưa biết trả nợ cũ hay mua mới', 'Import/đối chiếu DL_CONG_NO']);
  }

  if (capexOut > 0) {
    accountingTaskRows.push(['Cần CEO duyệt', 'Tách khoản đầu tư/capex khỏi chi phí vận hành', 'Kế toán', 'Hôm nay', `${formatMoney(capexOut)} cần đưa vào cân đối/capex nếu đúng bản chất`]);
    issueRows.push(['3', 'Có khoản đầu tư/capex trong sổ quỹ', formatMoney(capexOut), 'Không nên đưa thẳng vào chi phí vận hành/P&L tuần', 'CEO duyệt phân loại capex']);
  }

  if (largeExpenses.length > 0) {
    accountingTaskRows.push(['Cần kiểm', 'Kiểm tra top khoản chi lớn bất thường', 'Kế toán', 'Hôm nay', `${largeExpenses.length} khoản vượt ngưỡng ${formatMoney(largeThreshold)}`]);
    const largest = largeExpenses[0];
    issueRows.push(['4', 'Có khoản chi lớn cần kiểm tra', formatMoney(largest.amount), getExpenseDescription(largest.row), largest.action]);
  }

  if (!accountingTaskRows.length && rows.length) {
    accountingTaskRows.push(['Tốt', 'Sổ quỹ đã có dữ liệu, chưa phát hiện khoản chi cần phân loại gấp', 'Kế toán', 'Theo dõi', 'Tiếp tục đối chiếu với các nguồn còn lại']);
  }

  return {
    groupRows,
    largeExpenseRows,
    accountingTaskRows,
    issueRows: issueRows.slice(0, 5),
    largeExpenseCount: largeExpenses.length,
    unclassifiedOut,
    nccPaymentOut,
    capexOut,
    operatingOut: Math.max(0, operatingOut)
  };
}
