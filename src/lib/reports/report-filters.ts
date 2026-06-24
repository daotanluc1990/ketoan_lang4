import type { SourceContract, SourceKey } from './source-contract';
import { SOURCE_CONTRACTS, SOURCE_KEYS } from './source-contract';
import { isDateWithin, normalizeText, pickText, toIsoDate, toText, uniqueSorted, type DataRow } from './row-normalizers';

export type ReportFilter = {
  fromDate?: string;
  toDate?: string;
  weekCode?: string;
  branch?: string;
  channel?: string;
  costGroup?: string;
  source?: SourceKey | 'all';
  dataStatus?: string;
  alertStatus?: string;
  importedBy?: string;
};

export type ReportFilterMetadata = {
  appliedFilter: ReportFilter;
  sourceRowCountsBefore: Record<SourceKey, number>;
  sourceRowCountsAfter: Record<SourceKey, number>;
  activeFilterCount: number;
  filterSummary: string[];
  evidence: string[];
};

export type FilterOptions = {
  branches: string[];
  weekCodes: string[];
  channels: string[];
  sources: Array<{ key: SourceKey | 'all'; label: string }>;
  dataStatuses: string[];
  alertStatuses: string[];
  importedBy: string[];
  dateRange: { min?: string; max?: string };
};

const EMPTY_COUNTS = SOURCE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<SourceKey, number>);

function clean(value: unknown) {
  const text = toText(Array.isArray(value) ? value[0] : value);
  if (!text || ['all', 'tat ca', 'tất cả', 'toan bo', 'toàn bộ'].includes(normalizeText(text))) return undefined;
  return text;
}

export function parseReportFilterFromSearchParams(searchParams?: URLSearchParams | Record<string, string | string[] | undefined> | null): ReportFilter {
  const get = (key: string) => {
    if (!searchParams) return undefined;
    if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
    return searchParams[key];
  };

  const sourceRaw = clean(get('source'));
  const source = SOURCE_KEYS.includes(sourceRaw as SourceKey) ? (sourceRaw as SourceKey) : undefined;
  return {
    fromDate: clean(get('fromDate')),
    toDate: clean(get('toDate')),
    weekCode: clean(get('weekCode')),
    branch: clean(get('branch')),
    channel: clean(get('channel')),
    costGroup: clean(get('costGroup')),
    source: source ?? 'all',
    dataStatus: clean(get('dataStatus')),
    alertStatus: clean(get('alertStatus')),
    importedBy: clean(get('importedBy'))
  };
}

export function activeFilterCount(filter: ReportFilter) {
  return Object.entries(filter).filter(([key, value]) => key !== 'source' ? Boolean(value) : value && value !== 'all').length;
}

export function filterSummary(filter: ReportFilter) {
  const parts: string[] = [];
  if (filter.fromDate || filter.toDate) parts.push(`Kỳ: ${filter.fromDate ?? 'đầu'} → ${filter.toDate ?? 'cuối'}`);
  if (filter.weekCode) parts.push(`Tuần: ${filter.weekCode}`);
  if (filter.branch) parts.push(`Chi nhánh: ${filter.branch}`);
  if (filter.channel) parts.push(`Kênh bán: ${filter.channel}`);
  if (filter.costGroup) parts.push(`Nhóm chi phí: ${filter.costGroup}`);
  if (filter.source && filter.source !== 'all') parts.push(`Nguồn: ${SOURCE_CONTRACTS[filter.source].label}`);
  if (filter.dataStatus) parts.push(`Trạng thái dữ liệu: ${filter.dataStatus}`);
  if (filter.alertStatus) parts.push(`Cảnh báo: ${filter.alertStatus}`);
  if (filter.importedBy) parts.push(`Người nhập: ${filter.importedBy}`);
  return parts;
}


function isoWeekCodeFromDate(dateText: string) {
  const iso = toIsoDate(dateText);
  if (!iso) return '';
  const [yearText, monthText, dayText] = iso.split('-');
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText)));
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function isSourceEnabled(key: SourceKey, filter: ReportFilter) {
  return !filter.source || filter.source === 'all' || filter.source === key;
}

export function isValidImportRow(row: DataRow) {
  const importId = toText(row['Mã lần import']);
  const dataStatus = normalizeText(row['Trạng thái dữ liệu']);

  return Boolean(importId.startsWith('IMP-') && dataStatus === 'da xac nhan');
}

export function rowMatchesFilter(row: DataRow, contract: SourceContract, filter: ReportFilter) {
  if (!isSourceEnabled(contract.key, filter)) return false;

  const dateValue = pickText(row, contract.dateColumns);
  if ((filter.fromDate || filter.toDate) && !isDateWithin(dateValue, filter.fromDate, filter.toDate)) return false;

  if (filter.weekCode) {
    const weekText = pickText(row, contract.weekColumns) || isoWeekCodeFromDate(pickText(row, contract.dateColumns));
    if (!weekText || !normalizeText(weekText).includes(normalizeText(filter.weekCode))) return false;
  }

  if (filter.branch) {
    const branchText = pickText(row, contract.branchColumns);
    if (!branchText || normalizeText(branchText) !== normalizeText(filter.branch)) return false;
  }

  if (filter.channel) {
    const haystack = contract.channelColumns.map((column) => row[column]).map(normalizeText).join(' | ');
    if (!haystack || !haystack.includes(normalizeText(filter.channel))) return false;
  }

  if (filter.costGroup) {
    const haystack = contract.channelColumns.map((column) => row[column]).map(normalizeText).join(' | ');
    if (!haystack || !haystack.includes(normalizeText(filter.costGroup))) return false;
  }

  if (filter.dataStatus) {
    const statusText = pickText(row, contract.statusColumns);
    if (!statusText || normalizeText(statusText) !== normalizeText(filter.dataStatus)) return false;
  }

  if (filter.alertStatus) {
    const alertText = pickText(row, contract.alertStatusColumns);
    if (!alertText || normalizeText(alertText) !== normalizeText(filter.alertStatus)) return false;
  }

  if (filter.importedBy) {
    const importedBy = pickText(row, contract.importedByColumns);
    if (!importedBy || normalizeText(importedBy) !== normalizeText(filter.importedBy)) return false;
  }

  return true;
}

export function applySourceFilter(rows: DataRow[], key: SourceKey, filter: ReportFilter) {
  const contract = SOURCE_CONTRACTS[key];
  return rows.filter(isValidImportRow).filter((row) => rowMatchesFilter(row, contract, filter));
}

export function createFilterMetadata(filter: ReportFilter, before: Record<SourceKey, number>, after: Record<SourceKey, number>): ReportFilterMetadata {
  const summary = filterSummary(filter);
  const evidence = SOURCE_KEYS.map((key) => `${SOURCE_CONTRACTS[key].sheetName}: ${after[key]}/${before[key]} dòng sau lọc`);
  return {
    appliedFilter: filter,
    sourceRowCountsBefore: { ...EMPTY_COUNTS, ...before },
    sourceRowCountsAfter: { ...EMPTY_COUNTS, ...after },
    activeFilterCount: activeFilterCount(filter),
    filterSummary: summary,
    evidence
  };
}

export function buildFilterOptions(sourceRows: Partial<Record<SourceKey, DataRow[]>>): FilterOptions {
  const branches: string[] = [];
  const weekCodes: string[] = [];
  const channels: string[] = [];
  const dataStatuses: string[] = [];
  const alertStatuses: string[] = [];
  const importedBy: string[] = [];
  const dates: string[] = [];

  for (const key of SOURCE_KEYS) {
    const contract = SOURCE_CONTRACTS[key];
    const rows = (sourceRows[key] ?? []).filter(isValidImportRow);
    for (const row of rows) {
      branches.push(pickText(row, contract.branchColumns));
      weekCodes.push(pickText(row, contract.weekColumns));
      dataStatuses.push(pickText(row, contract.statusColumns));
      alertStatuses.push(pickText(row, contract.alertStatusColumns));
      importedBy.push(pickText(row, contract.importedByColumns));
      for (const column of contract.channelColumns) channels.push(toText(row[column]));
      const dateText = toIsoDate(pickText(row, contract.dateColumns));
      if (dateText) dates.push(dateText);
    }
  }

  const sortedDates = uniqueSorted(dates);
  return {
    branches: uniqueSorted(branches),
    weekCodes: uniqueSorted(weekCodes),
    channels: uniqueSorted(channels),
    sources: [{ key: 'all', label: 'Tất cả nguồn' }, ...SOURCE_KEYS.map((key) => ({ key, label: SOURCE_CONTRACTS[key].label }))],
    dataStatuses: uniqueSorted(dataStatuses),
    alertStatuses: uniqueSorted(alertStatuses),
    importedBy: uniqueSorted(importedBy),
    dateRange: { min: sortedDates[0], max: sortedDates[sortedDates.length - 1] }
  };
}
