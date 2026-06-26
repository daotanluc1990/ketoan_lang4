'use client';

import { useState, type ReactNode } from 'react';

export function LazyReportSection({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-black text-slate-800 hover:bg-slate-50"
      >
        <span>{title}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{open ? 'Ẩn' : 'Mở'}</span>
      </button>
      {open ? <div className="border-t border-slate-100 p-2">{children}</div> : null}
    </section>
  );
}
