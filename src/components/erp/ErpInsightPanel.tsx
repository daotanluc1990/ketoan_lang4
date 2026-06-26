import { clsx } from 'clsx';

const dotTone = {
  danger: 'bg-rose-600',
  warning: 'bg-orange-500',
  good: 'bg-emerald-600',
  neutral: 'bg-slate-400'
};

type Tone = keyof typeof dotTone;

export function ErpInsightPanel({
  title,
  rows,
  actionLabel
}: {
  title: string;
  rows: Array<{ label: string; value?: string | number; tone?: Tone; caption?: string }>;
  actionLabel?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[56px] items-center justify-between gap-3 border-b border-slate-200 px-4">
        <h3 className="text-base font-black tracking-[-0.02em] text-slate-950">{title}</h3>
        {actionLabel ? <span className="text-[12px] font-black text-red-700">{actionLabel}</span> : null}
      </div>
      <div className="divide-y divide-slate-100 px-4 py-2">
        {rows.length ? rows.map((row) => (
          <div className="flex items-center gap-3 py-3" key={row.label}>
            <span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', dotTone[row.tone ?? 'neutral'])} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[13px] font-bold text-slate-900">{row.label}</p>
              {row.caption ? <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-500">{row.caption}</p> : null}
            </div>
            {row.value !== undefined ? <span className="number shrink-0 text-[13px] font-black text-slate-700">{row.value}</span> : null}
          </div>
        )) : <p className="py-6 text-sm font-semibold text-slate-500">Chưa có dữ liệu.</p>}
      </div>
    </section>
  );
}
