import { getOrSetReportCache, hasExternalReportCache, setReportCache, stableCacheKey } from '@/lib/cache/report-cache';
import type { ReportFilter } from './report-filters';
import { saveReportArchive } from './report-archive';
import {
  buildFastBalanceReport,
  buildFastCashflowReport,
  buildFastFilterOptions,
  buildFastLossReport,
  buildFastOverviewReport,
  buildFastPnlReport,
  buildFastWorkbenchReport
} from './fast-page-reports';

const SNAPSHOT_TTL_SECONDS = Number(process.env.REPORT_SNAPSHOT_TTL_SECONDS ?? 900);
type ReportInput = ReportFilter | URLSearchParams | Record<string, string | string[] | undefined>;

function cacheKey(scope: string, input: ReportInput = {}) {
  return stableCacheKey(`snapshot:${scope}`, input instanceof URLSearchParams ? Object.fromEntries(input.entries()) : input);
}

export function buildSnapshotFilterOptions() {
  return getOrSetReportCache(cacheKey('filter-options'), SNAPSHOT_TTL_SECONDS, buildFastFilterOptions);
}

export function buildSnapshotOverviewReport(input: ReportInput = {}) {
  return getOrSetReportCache(cacheKey('overview', input), SNAPSHOT_TTL_SECONDS, () => buildFastOverviewReport(input));
}

export function buildSnapshotPnlReport(input: ReportInput = {}) {
  return getOrSetReportCache(cacheKey('pnl', input), SNAPSHOT_TTL_SECONDS, () => buildFastPnlReport(input));
}

export function buildSnapshotCashflowReport(input: ReportInput = {}) {
  return getOrSetReportCache(cacheKey('cashflow', input), SNAPSHOT_TTL_SECONDS, () => buildFastCashflowReport(input));
}

export function buildSnapshotBalanceReport(input: ReportInput = {}) {
  return getOrSetReportCache(cacheKey('balance', input), SNAPSHOT_TTL_SECONDS, () => buildFastBalanceReport(input));
}

export function buildSnapshotLossReport(input: ReportInput = {}) {
  return getOrSetReportCache(cacheKey('loss', input), SNAPSHOT_TTL_SECONDS, () => buildFastLossReport(input));
}

export function buildSnapshotWorkbenchReport(input: ReportInput = {}) {
  return getOrSetReportCache(cacheKey('workbench', input), SNAPSHOT_TTL_SECONDS, () => buildFastWorkbenchReport(input));
}

export async function refreshReportSnapshots(input: ReportInput = {}) {
  const [filterOptions, overview, pnl, cashflow, balance, loss, workbench] = await Promise.all([
    buildFastFilterOptions(),
    buildFastOverviewReport(input),
    buildFastPnlReport(input),
    buildFastCashflowReport(input),
    buildFastBalanceReport(input),
    buildFastLossReport(input),
    buildFastWorkbenchReport(input)
  ]);

  await Promise.all([
    setReportCache(cacheKey('filter-options'), SNAPSHOT_TTL_SECONDS, filterOptions),
    setReportCache(cacheKey('overview', input), SNAPSHOT_TTL_SECONDS, overview),
    setReportCache(cacheKey('pnl', input), SNAPSHOT_TTL_SECONDS, pnl),
    setReportCache(cacheKey('cashflow', input), SNAPSHOT_TTL_SECONDS, cashflow),
    setReportCache(cacheKey('balance', input), SNAPSHOT_TTL_SECONDS, balance),
    setReportCache(cacheKey('loss', input), SNAPSHOT_TTL_SECONDS, loss),
    setReportCache(cacheKey('workbench', input), SNAPSHOT_TTL_SECONDS, workbench)
  ]);

  const archived = await saveReportArchive('report-bundle', { input, overview, pnl, cashflow, balance, loss, workbench });

  return {
    ok: true,
    cache: hasExternalReportCache() ? 'external' : 'memory',
    ttlSeconds: SNAPSHOT_TTL_SECONDS,
    archived,
    refreshed: ['filter-options', 'overview', 'pnl', 'cashflow', 'balance', 'loss', 'workbench'],
    createdAt: new Date().toISOString()
  };
}
