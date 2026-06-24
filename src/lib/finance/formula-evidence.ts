import type { DataStatus, FormulaEvidence } from './finance-types';

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Chưa đủ dữ liệu';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Chưa đủ dữ liệu';
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Chưa đủ dữ liệu';
  return Math.round(value).toLocaleString('vi-VN');
}

export function statusLabel(status: DataStatus) {
  switch (status) {
    case 'complete': return 'Đủ dữ liệu';
    case 'partial': return 'Dữ liệu một phần';
    case 'needs_review': return 'Cần đối chiếu';
    case 'missing':
    default: return 'Chưa đủ dữ liệu';
  }
}

export function makeEvidence(input: FormulaEvidence): FormulaEvidence {
  return input;
}

export function evidenceToRow(evidence: FormulaEvidence) {
  return [
    evidence.metric,
    evidence.source,
    String(evidence.rowCount),
    evidence.formula,
    evidence.period,
    statusLabel(evidence.status),
    evidence.note
  ];
}

export function periodLabel(weekCode?: string, fromDate?: string, toDate?: string) {
  if (weekCode) return weekCode;
  if (fromDate || toDate) return `${fromDate ?? 'đầu'} → ${toDate ?? 'cuối'}`;
  return 'Theo bộ lọc hiện tại';
}
