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
  centralKitchenOut: number;
};

type ClassifiedExpense = {
  row: DataRow;
  amount: number;
  category: string;
  status: string;
  action: string;
  costCenter: string;
  treatment: string;
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

function cashbookArea(row: DataRow) {
  const explicit = normalizeText(`${pickText(row, ['Khu vực'])} ${pickText(row, ['Phân loại P&L'])}`);
  const description = normalizeText(`${pickText(row, ['Diễn giải'])} ${pickText(row, ['Nhóm thu/chi'])} ${pickText(row, ['Ghi chú'])} ${pickText(row, ['Chi nhánh'])}`);
  if (includesAny(`${explicit} ${description}`, ['bếp trung tâm', 'bep trung tam', 'chi nhánh trung tâm', 'chi nhanh trung tam', 'chi bếp trung tâm', 'chi bep trung tam'])) return 'Bếp Trung Tâm';
  if (includesAny(`${explicit} ${description}`, ['nvt', 'nguyễn văn tăng', 'nguyen van tang', 'làng nvt', 'lang nvt'])) return 'Chi nhánh NVT';
  return pickText(row, ['Khu vực', 'Chi nhánh']) || 'Chưa rõ';
}

function treatmentFor(category: string, costCenter: string) {
  if (costCenter === 'Bếp Trung Tâm') return 'Theo dõi riêng BTT';
  if (costCenter === 'Chưa rõ') return 'Cần xác định đơn vị';
  if (category === 'Trả NCC/công nợ') return 'Đối chiếu công nợ';
  if (category === 'Đầu tư/Capex') return 'Không tính P&L tuần';
  if (category === 'Khác cần phân loại') return 'Cần phân loại';
  return 'Tính P&L chi nhánh';
}

export function classifyCashbookExpense(row: DataRow) {
  const description = normalizeText(`${pickText(row, ['Diễn giải'])} ${pickText(row, ['Nhóm thu/chi'])} ${pickText(row, ['Người tạo'])} ${pickText(row, ['Ghi chú'])} ${pickText(row, ['Phân loại P&L'])}`);
  const originalGroup = pickText(row, ['Nhóm thu/chi']);
  const pnlClass = normalizeText(pickText(row, ['Phân loại P&L']));
  const area = cashbookArea(row);

  const wrap = (category: string, status: string, action: string) => ({ category, status, action, costCenter: area, treatment: treatmentFor(category, area) });

  if (pnlClass === normalizeText('Chi Bếp Trung Tâm') || area === 'Bếp Trung Tâm') {
    return wrap('Chi Bếp Trung Tâm', 'Cần theo dõi riêng', 'Không trộn vào chi phí cửa hàng; theo dõi riêng BTT.');
  }
  if (includesAny(description, ['trả ncc', 'tra ncc', 'nhà cung cấp', 'nha cung cap', 'công nợ', 'cong no', 'thanh toán ncc', 'thanh toan ncc'])) return wrap('Trả NCC/công nợ', 'Cần đối chiếu', 'Đối chiếu DL_CONG_NO trước khi đưa vào P&L.');
  if (includesAny(description, ['đầu tư', 'dau tu', 'nhà xưởng', 'nha xuong', 'máy móc', 'may moc', 'thiết bị', 'thiet bi', 'xây dựng', 'xay dung'])) return wrap('Đầu tư/Capex', 'Cần CEO duyệt', 'Tách khỏi chi phí vận hành, theo dõi ở cân đối/capex.');
  if (includesAny(description, ['thuê mặt bằng', 'thue mat bang', 'mặt bằng', 'mat bang', 'tiền thuê', 'tien thue'])) return wrap('Thuê mặt bằng', 'Cần kiểm', 'Kiểm tra đúng kỳ thuê và tránh ghi trùng.');
  if (includesAny(description, ['điện', 'dien', 'nước', 'nuoc', 'gas'])) return wrap('Điện/nước/gas', 'Tốt', 'Theo dõi xu hướng tuần/tháng.');
  if (includesAny(description, ['rau', 'củ', 'cu', 'đồ chua', 'do chua', 'gạo', 'gao', 'thịt', 'thit', 'sườn', 'suon', 'nvl', 'nguyên liệu', 'nguyen lieu', 'hộp', 'hop'])) return wrap('Mua NVL/bao bì', 'Cần đối chiếu', 'Đối chiếu thu mua, tồn kho và thất thoát.');
  if (includesAny(description, ['sửa chữa', 'sua chua', 'bảo trì', 'bao tri'])) return wrap('Sửa chữa/bảo trì', 'Cần kiểm', 'Kiểm tra phát sinh bất thường và hóa đơn.');
  if (includesAny(description, ['lương', 'luong', 'nhân sự', 'nhan su', 'parttime', 'part time', 'fulltime', 'full time'])) return wrap('Nhân sự', 'Cần kiểm', 'Đối chiếu bảng công/lương trước khi đưa vào P&L.');
  if (originalGroup && normalizeText(originalGroup) !== 'khac') return wrap(originalGroup, area === 'Chưa rõ' ? 'Cần kiểm tra' : 'Tốt', area === 'Chưa rõ' ? 'Bổ sung Chi nhánh/BTT chịu chi.' : 'Theo dõi theo nhóm sổ quỹ.');
  return wrap('Khác cần phân loại', 'Cảnh báo', 'Kế toán phân loại lại bằng diễn giải/hóa đơn.');
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
  const byCategory = new Map<string, { amount: number; count: number; status: string; action: string; costCenter: string; category: string; treatment: string }>();
  const byCostCenter = new Map<string, { amount: number; count: number; status: string }>();

  for (const item of expenses) {
    const costKey = item.costCenter;
    const costCurrent = byCostCenter.get(costKey) ?? { amount: 0, count: 0, status: item.costCenter === 'Chưa rõ' ? 'Cảnh báo' : item.costCenter === 'Bếp Trung Tâm' ? 'Cần theo dõi riêng' : 'Tốt' };
    costCurrent.amount += item.amount;
    costCurrent.count += 1;
    byCostCenter.set(costKey, costCurrent);

    const key = `${item.costCenter}|||${item.category}|||${item.treatment}`;
    const current = byCategory.get(key) ?? { amount: 0, count: 0, status: item.status, action: item.action, costCenter: item.costCenter, category: item.category, treatment: item.treatment };
    current.amount += item.amount;
    current.count += 1;
    if (['Cảnh báo', 'Cần CEO duyệt', 'Cần đối chiếu', 'Cần theo dõi riêng', 'Cần kiểm tra'].includes(item.status)) current.status = item.status;
    byCategory.set(key, current);
  }

  const groupRows = [
    ...Array.from(byCostCenter.entries()).sort((a, b) => b[1].amount - a[1].amount).map(([costCenter, value]) => [
      costCenter,
      'Tổng chi theo đơn vị chịu chi',
      formatMoney(value.amount),
      costCenter === 'Bếp Trung Tâm' ? 'Theo dõi riêng BTT' : costCenter === 'Chưa rõ' ? 'Cần xác định đơn vị' : 'Tính P&L chi nhánh',
      totalOut ? formatPercent(value.amount / totalOut) : '—',
      value.status,
      `${value.count} dòng · ${costCenter === 'Chưa rõ' ? 'Bổ sung Chi nhánh/BTT chịu chi' : 'Đã nhận diện đơn vị chịu chi'}`
    ]),
    ...Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount).map((value) => [
      value.costCenter,
      value.category,
      formatMoney(value.amount),
      value.treatment,
      totalOut ? formatPercent(value.amount / totalOut) : '—',
      value.status,
      `${value.count} dòng · ${value.action}`
    ])
  ];

  const largeThreshold = Math.max(3_000_000, totalOut * 0.05);
  const largeExpenses = expenses.filter((item) => item.amount >= largeThreshold).sort((a, b) => b.amount - a.amount).slice(0, 10);

  const largeExpenseRows = largeExpenses.map((item) => [
    toIsoDate(pickText(item.row, ['Ngày'])) || '—',
    pickText(item.row, ['Mã tuần', 'Tuần']) || '—',
    item.costCenter,
    item.category,
    item.treatment,
    getExpenseDescription(item.row),
    formatMoney(item.amount),
    item.status,
    item.action
  ]);

  const unclassifiedOut = expenses.filter((item) => item.category === 'Khác cần phân loại' || item.costCenter === 'Chưa rõ').reduce((total, item) => total + item.amount, 0);
  const nccPaymentOut = expenses.filter((item) => item.category === 'Trả NCC/công nợ').reduce((total, item) => total + item.amount, 0);
  const capexOut = expenses.filter((item) => item.category === 'Đầu tư/Capex').reduce((total, item) => total + item.amount, 0);
  const centralKitchenOut = expenses.filter((item) => item.costCenter === 'Bếp Trung Tâm').reduce((total, item) => total + item.amount, 0);
  const operatingOut = totalOut - nccPaymentOut - capexOut - unclassifiedOut - centralKitchenOut;

  const accountingTaskRows: string[][] = [];
  const issueRows: string[][] = [];

  if (centralKitchenOut > 0) accountingTaskRows.push(['Cần theo dõi', 'Tách chi Bếp Trung Tâm khỏi chi phí cửa hàng', 'Kế toán', 'Hôm nay', `${formatMoney(centralKitchenOut)} cần theo dõi riêng theo cost center`]);

  const unclearCostCenterOut = expenses.filter((item) => item.costCenter === 'Chưa rõ').reduce((total, item) => total + item.amount, 0);
  if (unclearCostCenterOut > 0) {
    accountingTaskRows.push(['Cảnh báo', 'Xác định Chi nhánh/BTT cho khoản chi chưa rõ', 'Kế toán', 'Hôm nay', `${formatMoney(unclearCostCenterOut)} chưa rõ đơn vị chịu chi`]);
    issueRows.push(['1', 'Có khoản chi chưa rõ Chi nhánh/BTT', formatMoney(unclearCostCenterOut), 'Thiếu hoặc không rõ Khu vực/Chi nhánh trong sổ quỹ', 'Bổ sung đơn vị chịu chi trước khi chốt']);
  }

  if (unclassifiedOut > 0) {
    accountingTaskRows.push(['Cảnh báo', 'Phân loại lại nhóm Khác trong sổ quỹ', 'Kế toán', 'Hôm nay', `${formatMoney(unclassifiedOut)} đang chưa đủ rõ bản chất/đơn vị`]);
    issueRows.push(['2', 'Nhóm Khác/cần phân loại trong sổ quỹ cao', formatMoney(unclassifiedOut), 'Diễn giải chưa đủ để tách chi phí/trả nợ/capex/đơn vị', 'Kế toán phân loại lại trước khi chốt P&L']);
  }

  if (nccPaymentOut > 0) {
    accountingTaskRows.push(['Cần đối chiếu', 'Đối chiếu tiền trả NCC với công nợ', 'Kế toán', 'Hôm nay', relatedCounts.debt ? 'Đã có DL_CONG_NO để đối chiếu' : 'Chưa có DL_CONG_NO, chưa kết luận là chi phí tuần']);
    if (!relatedCounts.debt) issueRows.push(['3', 'Tiền trả NCC chưa có bảng công nợ đối chiếu', formatMoney(nccPaymentOut), 'Sổ quỹ chỉ cho biết tiền đã ra, chưa biết trả nợ cũ hay mua mới', 'Import/đối chiếu DL_CONG_NO']);
  }

  if (capexOut > 0) {
    accountingTaskRows.push(['Cần CEO duyệt', 'Tách khoản đầu tư/capex khỏi chi phí vận hành', 'Kế toán', 'Hôm nay', `${formatMoney(capexOut)} cần đưa vào cân đối/capex nếu đúng bản chất`]);
    issueRows.push(['4', 'Có khoản đầu tư/capex trong sổ quỹ', formatMoney(capexOut), 'Không nên đưa thẳng vào chi phí vận hành/P&L tuần', 'CEO duyệt phân loại capex']);
  }

  if (largeExpenses.length > 0) {
    accountingTaskRows.push(['Cần kiểm', 'Kiểm tra top khoản chi lớn bất thường', 'Kế toán', 'Hôm nay', `${largeExpenses.length} khoản vượt ngưỡng ${formatMoney(largeThreshold)}`]);
    const largest = largeExpenses[0];
    issueRows.push(['5', 'Có khoản chi lớn cần kiểm tra', formatMoney(largest.amount), `${largest.costCenter} · ${getExpenseDescription(largest.row)}`, largest.action]);
  }

  if (!accountingTaskRows.length && rows.length) accountingTaskRows.push(['Tốt', 'Sổ quỹ đã có dữ liệu, chưa phát hiện khoản chi cần phân loại gấp', 'Kế toán', 'Theo dõi', 'Tiếp tục đối chiếu với các nguồn còn lại']);

  return {
    groupRows,
    largeExpenseRows,
    accountingTaskRows,
    issueRows: issueRows.slice(0, 5),
    largeExpenseCount: largeExpenses.length,
    unclassifiedOut,
    nccPaymentOut,
    capexOut,
    centralKitchenOut,
    operatingOut: Math.max(0, operatingOut)
  };
}
