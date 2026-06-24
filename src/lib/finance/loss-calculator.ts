import type { ReportFilter } from '@/lib/reports/report-filters';
import { pickNumber, toRatio, type DataRow } from '@/lib/reports/row-normalizers';
import { evidenceToRow, formatMoney, formatPercent, makeEvidence, periodLabel } from './formula-evidence';
import type { LossCalculationResult } from './finance-types';

export type LossCalculationInput = {
  lossRows: DataRow[];
  filter?: ReportFilter;
};

export function calculateLoss(input: LossCalculationInput): LossCalculationResult {
  const { lossRows, filter } = input;
  const period = periodLabel(filter?.weekCode, filter?.fromDate, filter?.toDate);
  const mapped = lossRows
    .map((row) => ({
      row,
      value: Math.abs(pickNumber(row, ['Giá trị chênh lệch'])),
      ratio: toRatio(row['Tỷ lệ thất thoát']),
      overRatio: toRatio(row['Mức vượt định mức']),
      statusText: String(row['Trạng thái'] ?? '')
    }))
    .sort((a, b) => b.value - a.value);

  const totalLossValue = mapped.reduce((total, item) => total + item.value, 0);
  const dangerousCount = mapped.filter((item) => item.statusText.includes('Nguy') || item.ratio >= 0.05 || item.overRatio > 0).length;
  const limitations: string[] = [];
  if (!lossRows.length) limitations.push('Thiếu DL_THAT_THOAT_NVL nên chưa kết luận thất thoát NVL.');

  const topRows = mapped.slice(0, 5).map(({ row, value, ratio }) => [
    String(row['Tên nguyên vật liệu'] ?? ''),
    String(row['Đơn vị tính'] ?? ''),
    String(row['Chênh lệch số lượng'] ?? ''),
    formatMoney(value),
    formatPercent(ratio),
    String(row['Định mức cho phép'] ?? 'Chưa có'),
    String(row['Mức vượt định mức'] ?? 'Chưa tính'),
    String(row['Trạng thái'] ?? (ratio > 0.05 ? 'Cảnh báo' : 'Tốt')),
    String(row['Hành động đề xuất'] ?? 'Kiểm tra lại')
  ]);

  const rows = [
    ['Tổng quan', 'Tổng thất thoát quy tiền', lossRows.length ? formatMoney(totalLossValue) : 'Chưa đủ dữ liệu', '—', '—', lossRows.length ? (totalLossValue ? 'Cảnh báo' : 'Tốt') : 'Chưa đủ dữ liệu', `${lossRows.length} dòng NVL`],
    ['Tổng quan', 'Số dòng nguy hiểm/cảnh báo', lossRows.length ? String(dangerousCount) : 'Chưa đủ dữ liệu', '—', '—', dangerousCount ? 'Cảnh báo' : lossRows.length ? 'Tốt' : 'Chưa đủ dữ liệu', 'Dựa trên trạng thái/tỷ lệ/mức vượt định mức'],
    ...topRows.map((row, index) => ['Top thất thoát', `${index + 1}. ${row[0]}`, row[3], '—', '—', row[7], `${row[4]} · ${row[8]}`])
  ];

  const evidences = [
    makeEvidence({ metric: 'Tổng thất thoát quy tiền', source: 'DL_THAT_THOAT_NVL', rowCount: lossRows.length, formula: 'SUM(ABS(Giá trị chênh lệch))', period, status: lossRows.length ? 'complete' : 'missing', note: lossRows.length ? 'Tổng phải khớp KPI thất thoát trên CEO Dashboard cùng bộ lọc.' : 'Cần import báo cáo thất thoát NVL.' }),
    makeEvidence({ metric: 'Xếp hạng thất thoát', source: 'DL_THAT_THOAT_NVL', rowCount: lossRows.length, formula: 'ORDER BY ABS(Giá trị chênh lệch) DESC', period, status: lossRows.length ? 'complete' : 'missing', note: 'Dùng để ưu tiên nguyên vật liệu cần xử lý.' })
  ];

  return {
    rows,
    topRows,
    evidenceRows: evidences.map(evidenceToRow),
    limitations,
    status: lossRows.length ? 'complete' : 'missing',
    totalLossValue,
    dangerousCount
  };
}
