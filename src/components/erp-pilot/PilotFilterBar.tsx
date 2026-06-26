'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function labelsFor(pathname: string) {
  if (pathname.includes('pl-tuan')) return { scope: 'Nhóm chi', scopeHint: 'NVL / nhân sự / BTT', state: 'Trạng thái P&L', stateHint: 'tạm / cần đối chiếu' };
  if (pathname.includes('dong-tien')) return { scope: 'Loại tiền', scopeHint: 'tiền vào / tiền ra', state: 'Trạng thái', stateHint: 'cần đối chiếu' };
  if (pathname.includes('that-thoat')) return { scope: 'NVL', scopeHint: 'sườn / gạo / mỡ', state: 'Trạng thái', stateHint: 'thiếu / dư / cần kiểm' };
  if (pathname.includes('import')) return { scope: 'Nguồn file', scopeHint: 'Grab / Shopee / KiotViet', state: 'Trạng thái import', stateHint: 'preview / lỗi / đạt' };
  if (pathname.includes('bot')) return { scope: 'Module', scopeHint: 'AI / Telegram / Sheet', state: 'Trạng thái cấu hình', stateHint: 'đủ / thiếu' };
  return { scope: 'Nguồn', scopeHint: 'app / sổ quỹ / kho', state: 'Trạng thái', stateHint: 'tốt / cần đối chiếu' };
}

export function PilotFilterBar({ status }: { status: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const labels = labelsFor(pathname);
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(params.get('fromDate') ?? '');
  const [toDate, setToDate] = useState(params.get('toDate') ?? '');
  const [branch, setBranch] = useState(params.get('branch') ?? '');
  const [scope, setScope] = useState(params.get('scope') ?? '');
  const [state, setState] = useState(params.get('state') ?? '');
  const activeCount = [fromDate, toDate, branch, scope, state].filter(Boolean).length;
  const dateLabel = fromDate || toDate ? `${fromDate || '—'} → ${toDate || '—'}` : 'Theo kỳ hiện tại';

  function apply() {
    const next = new URLSearchParams(params.toString());
    if (fromDate) next.set('fromDate', fromDate); else next.delete('fromDate');
    if (toDate) next.set('toDate', toDate); else next.delete('toDate');
    if (branch) next.set('branch', branch); else next.delete('branch');
    if (scope) next.set('scope', scope); else next.delete('scope');
    if (state) next.set('state', state); else next.delete('state');
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    router.refresh();
    setOpen(false);
  }

  function clear() {
    setFromDate('');
    setToDate('');
    setBranch('');
    setScope('');
    setState('');
    router.push(pathname);
    router.refresh();
    setOpen(false);
  }

  return (
    <section className="sticky top-[54px] z-10 border-b border-slate-200 bg-white/95 px-4 py-1.5 backdrop-blur lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black text-slate-600">
          <span className="text-slate-900">Bộ lọc</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5">{activeCount} bộ lọc</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-amber-700">{dateLabel}</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-amber-700">{status}</span>
        </div>
        <button className="h-7 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-700 shadow-sm" type="button" onClick={() => setOpen((current) => !current)}>{open ? 'Đóng bộ lọc' : 'Mở bộ lọc'}</button>
      </div>
      {open ? (
        <div className="mt-2 grid gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm md:grid-cols-6">
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">Từ ngày<input className="h-7 rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-700" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">Đến ngày<input className="h-7 rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-700" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">Chi nhánh<input className="h-7 rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-700" placeholder="VD: Làng NVT" value={branch} onChange={(event) => setBranch(event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">{labels.scope}<input className="h-7 rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-700" placeholder={labels.scopeHint} value={scope} onChange={(event) => setScope(event.target.value)} /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">{labels.state}<input className="h-7 rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-700" placeholder={labels.stateHint} value={state} onChange={(event) => setState(event.target.value)} /></label>
          <div className="flex items-end gap-2"><button className="h-7 rounded-lg bg-[#b80012] px-3 text-[11px] font-black text-white" type="button" onClick={apply}>Làm mới</button><button className="h-7 rounded-lg border border-slate-200 px-3 text-[11px] font-black text-slate-600" type="button" onClick={clear}>Xóa</button></div>
        </div>
      ) : null}
    </section>
  );
}
