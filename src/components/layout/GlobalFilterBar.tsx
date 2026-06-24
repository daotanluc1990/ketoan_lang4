'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { FilterOptions, ReportFilter } from '@/lib/reports/report-filters';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-0"><span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-black/45">{label}</span>{children}</label>;
}

const inputClass = 'h-8 w-full min-w-0 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold text-lang-brown shadow-sm outline-none focus:border-lang-red/60 focus:ring-2 focus:ring-lang-red/10';
const allValue = 'all';

type UiFilter = Required<Pick<ReportFilter, 'fromDate' | 'toDate' | 'weekCode' | 'branch' | 'channel' | 'costGroup' | 'dataStatus' | 'alertStatus' | 'importedBy'>> & { source: string };

const emptyFilter: UiFilter = {
  fromDate: '',
  toDate: '',
  weekCode: '',
  branch: '',
  channel: '',
  costGroup: '',
  source: allValue,
  dataStatus: '',
  alertStatus: '',
  importedBy: ''
};

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
  return (
    <>
      <option value="">{allLabel}</option>
      {values.map((value) => <option key={value} value={value}>{value}</option>)}
    </>
  );
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
        if (!response.ok || !payload?.ok) {
          setError(payload?.message ?? 'Không đọc được bộ lọc từ dữ liệu thật.');
          return;
        }
        setOptions(payload.options);
        setError('');
      })
      .catch(() => {
        if (active) setError('Không đọc được bộ lọc từ dữ liệu thật.');
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });
    return () => { active = false; };
  }, []);

  const activeCount = useMemo(() => Object.entries(filter).filter(([key, value]) => value && !(key === 'source' && value === allValue)).length, [filter]);

  const update = (key: keyof UiFilter, value: string) => setFilter((current) => ({ ...current, [key]: value }));

  const applyFilter = () => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    for (const [key, value] of Object.entries(filter)) {
      if (value && !(key === 'source' && value === allValue)) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    router.refresh();
  };

  const clearFilter = () => {
    setFilter(emptyFilter);
    router.push(pathname);
    router.refresh();
  };

  return (
    <section className="sticky top-14 z-10 border-b border-black/5 bg-lang-cream/95 backdrop-blur">
      <div className="grid w-full gap-2 px-3 py-2 sm:px-4 lg:px-5">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <Field label="Chi nhánh">
            <select className={inputClass} aria-label="Chi nhánh" value={filter.branch} onChange={(event) => update('branch', event.target.value)}>
              <OptionList values={options?.branches ?? []} allLabel="Tất cả chi nhánh" />
            </select>
          </Field>
          <Field label="Kỳ báo cáo">
            <select className={inputClass} aria-label="Mã tuần" value={filter.weekCode} onChange={(event) => update('weekCode', event.target.value)}>
              <OptionList values={options?.weekCodes ?? []} allLabel="Tất cả tuần" />
            </select>
          </Field>
          <Field label="Từ ngày"><input className={inputClass} type="date" value={filter.fromDate} min={options?.dateRange.min} max={options?.dateRange.max} aria-label="Từ ngày" onChange={(event) => update('fromDate', event.target.value)} /></Field>
          <Field label="Đến ngày"><input className={inputClass} type="date" value={filter.toDate} min={options?.dateRange.min} max={options?.dateRange.max} aria-label="Đến ngày" onChange={(event) => update('toDate', event.target.value)} /></Field>
          <Field label="Trạng thái dữ liệu">
            <select className={inputClass} aria-label="Trạng thái dữ liệu" value={filter.dataStatus} onChange={(event) => update('dataStatus', event.target.value)}>
              <OptionList values={options?.dataStatuses ?? []} allLabel="Tất cả trạng thái" />
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
          <Field label="Nguồn dữ liệu">
            <select className={inputClass} aria-label="Nguồn dữ liệu" value={filter.source} onChange={(event) => update('source', event.target.value)}>
              {(options?.sources ?? [{ key: allValue, label: 'Tất cả nguồn' }]).map((source) => <option key={source.key} value={source.key}>{source.label}</option>)}
            </select>
          </Field>
          <Field label="Kênh bán">
            <select className={inputClass} aria-label="Kênh hoặc nhóm dữ liệu" value={filter.channel} onChange={(event) => update('channel', event.target.value)}>
              <OptionList values={options?.channels ?? []} allLabel="Tất cả kênh bán" />
            </select>
          </Field>
          <Field label="Nhóm chi phí">
            <select className={inputClass} aria-label="Nhóm chi phí" value={filter.costGroup} onChange={(event) => update('costGroup', event.target.value)}>
              <OptionList values={options?.channels ?? []} allLabel="Tất cả nhóm" />
            </select>
          </Field>
          <Field label="Cảnh báo">
            <select className={inputClass} aria-label="Trạng thái cảnh báo" value={filter.alertStatus} onChange={(event) => update('alertStatus', event.target.value)}>
              <OptionList values={options?.alertStatuses ?? []} allLabel="Tất cả cảnh báo" />
            </select>
          </Field>
          <Field label="Người nhập">
            <select className={inputClass} aria-label="Người nhập liệu" value={filter.importedBy} onChange={(event) => update('importedBy', event.target.value)}>
              <OptionList values={options?.importedBy ?? []} allLabel="Tất cả người nhập" />
            </select>
          </Field>
          <div className="flex items-end gap-2"><button className="h-8 w-full rounded-lg bg-lang-red px-3 text-xs font-bold text-white shadow-sm hover:bg-lang-red/90 md:w-auto" type="button" onClick={applyFilter}>Làm mới</button><button className="h-8 w-full rounded-lg bg-white px-3 text-xs font-bold text-lang-brown ring-1 ring-black/10 hover:bg-lang-cream md:w-auto" type="button" onClick={clearFilter}>Xóa lọc</button></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-black/50">
          <span>{loadingOptions ? 'Đang đọc bộ lọc từ dữ liệu thật...' : `Bộ lọc đang bật: ${activeCount}`}</span>
          {options?.dateRange.min || options?.dateRange.max ? <span>Khoảng ngày dữ liệu: {options.dateRange.min ?? '—'} → {options.dateRange.max ?? '—'}</span> : null}
          {error ? <span className="text-red-700">{error}</span> : null}
        </div>
      </div>
    </section>
  );
}
