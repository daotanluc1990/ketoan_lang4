'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { FilterOptions, ReportFilter } from '@/lib/reports/report-filters';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-0"><span className="mb-0.5 block text-[9px] font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

const inputClass = 'h-7 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-800 shadow-sm outline-none focus:border-red-700/50 focus:ring-2 focus:ring-red-700/10';
const allValue = 'all';

type UiFilter = Required<Pick<ReportFilter, 'fromDate' | 'toDate' | 'weekCode' | 'branch' | 'channel' | 'costGroup' | 'dataStatus' | 'alertStatus' | 'importedBy'>> & { source: string };

const emptyFilter: UiFilter = { fromDate: '', toDate: '', weekCode: '', branch: '', channel: '', costGroup: '', source: allValue, dataStatus: '', alertStatus: '', importedBy: '' };

function readFilterFromWindow(): UiFilter {
  if (typeof window === 'undefined') return emptyFilter;
  const params = new URLSearchParams(window.location.search);
  return {
    fromDate: params.get('fromDate') ?? '',
    toDate: params.get('toDate') ?? '',
    weekCode: params.get('weekCode') ?? '',
    branch: params.get('branch') ?? '',
    channel: params.get('channel') ?? '',
    costGroup: params.get('costGroup') ?? '',
    source: params.get('source') ?? allValue,
    dataStatus: params.get('dataStatus') ?? '',
    alertStatus: params.get('alertStatus') ?? '',
    importedBy: params.get('importedBy') ?? ''
  };
}

function OptionList({ values, allLabel }: { values: string[]; allLabel: string }) {
  return <><option value="">{allLabel}</option>{values.map((value) => <option key={value} value={value}>{value}</option>)}</>;
}

export function GlobalFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [filter, setFilter] = useState<UiFilter>(() => readFilterFromWindow());
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/reports/filter-options', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok || !payload?.ok) { setError(payload?.message ?? 'Không đọc được bộ lọc.'); return; }
        setOptions(payload.options);
        setError('');
      })
      .catch(() => { if (active) setError('Không đọc được bộ lọc.'); })
      .finally(() => { if (active) setLoadingOptions(false); });
    return () => { active = false; };
  }, []);

  const activeCount = useMemo(() => Object.entries(filter).filter(([key, value]) => value && !(key === 'source' && value === allValue)).length, [filter]);
  const advancedActive = Boolean(filter.source !== allValue || filter.channel || filter.costGroup || filter.dataStatus || filter.alertStatus || filter.importedBy);
  const dateLabel = filter.fromDate || filter.toDate ? `${filter.fromDate || '—'} → ${filter.toDate || '—'}` : options?.dateRange.min || options?.dateRange.max ? `${options.dateRange.min ?? '—'} → ${options.dateRange.max ?? '—'}` : 'Chưa có khoảng ngày';

  const update = (key: keyof UiFilter, value: string) => setFilter((current) => ({ ...current, [key]: value }));
  const applyFilter = () => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    for (const [key, value] of Object.entries(filter)) {
      if (value && !(key === 'source' && value === allValue)) params.set(key, value); else params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    router.refresh();
  };
  const clearFilter = () => { setFilter(emptyFilter); router.push(pathname); router.refresh(); };

  return (
    <section className="sticky top-11 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="w-full px-3 py-1 sm:px-4 lg:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black text-slate-600">
            <span className="text-slate-900">Bộ lọc</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{loadingOptions ? 'đang đọc' : `${activeCount} bộ lọc`}</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">{dateLabel}</span>
            {error ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">{error}</span> : null}
          </div>
          <details className="group" open={advancedActive}>
            <summary className="cursor-pointer list-none rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-700 hover:bg-slate-50">Mở bộ lọc</summary>
            <div className="mt-1.5 grid min-w-[calc(100vw-1.5rem)] grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <Field label="Chi nhánh"><select className={inputClass} value={filter.branch} onChange={(e) => update('branch', e.target.value)}><OptionList values={options?.branches ?? []} allLabel="Tất cả chi nhánh" /></select></Field>
              <Field label="Kỳ báo cáo"><select className={inputClass} value={filter.weekCode} onChange={(e) => update('weekCode', e.target.value)}><OptionList values={options?.weekCodes ?? []} allLabel="Tất cả tuần" /></select></Field>
              <Field label="Từ ngày"><input className={inputClass} type="date" value={filter.fromDate} min={options?.dateRange.min} max={options?.dateRange.max} onChange={(e) => update('fromDate', e.target.value)} /></Field>
              <Field label="Đến ngày"><input className={inputClass} type="date" value={filter.toDate} min={options?.dateRange.min} max={options?.dateRange.max} onChange={(e) => update('toDate', e.target.value)} /></Field>
              <div className="flex items-end gap-1.5"><button className="h-7 rounded-md bg-red-700 px-2.5 text-[11px] font-black text-white" type="button" onClick={applyFilter}>Làm mới</button><button className="h-7 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-700" type="button" onClick={clearFilter}>Xóa</button></div>
              <Field label="Nguồn"><select className={inputClass} value={filter.source} onChange={(e) => update('source', e.target.value)}>{(options?.sources ?? [{ key: allValue, label: 'Tất cả nguồn' }]).map((source) => <option key={source.key} value={source.key}>{source.label}</option>)}</select></Field>
              <Field label="Kênh"><select className={inputClass} value={filter.channel} onChange={(e) => update('channel', e.target.value)}><OptionList values={options?.channels ?? []} allLabel="Tất cả kênh" /></select></Field>
              <Field label="Nhóm chi"><select className={inputClass} value={filter.costGroup} onChange={(e) => update('costGroup', e.target.value)}><OptionList values={options?.channels ?? []} allLabel="Tất cả nhóm" /></select></Field>
              <Field label="Dữ liệu"><select className={inputClass} value={filter.dataStatus} onChange={(e) => update('dataStatus', e.target.value)}><OptionList values={options?.dataStatuses ?? []} allLabel="Tất cả" /></select></Field>
              <Field label="Cảnh báo"><select className={inputClass} value={filter.alertStatus} onChange={(e) => update('alertStatus', e.target.value)}><OptionList values={options?.alertStatuses ?? []} allLabel="Tất cả" /></select></Field>
              <Field label="Người nhập"><select className={inputClass} value={filter.importedBy} onChange={(e) => update('importedBy', e.target.value)}><OptionList values={options?.importedBy ?? []} allLabel="Tất cả" /></select></Field>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
