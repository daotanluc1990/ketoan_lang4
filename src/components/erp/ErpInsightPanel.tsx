import { clsx } from 'clsx';

const dotTone = {
  danger: 'bg-rose-600',
  warning: 'bg-orange-500',
  good: 'bg-emerald-600',
  neutral: 'bg-slate-400'
};

type Tone = keyof typeof dotTone;

function normalizeTone(tone?: string): Tone {
  return tone === 'danger' || tone === 'warning' || tone === 'good' || tone === 'neutral' ? tone : 'neutral';
}

export function ErpInsightPanel({
  title,
  rows,
  actionLabel
}: {
  title: string;
  rows: Array<{ label: string; value?: string | number; tone?: string; caption?: string }>;
  actionLabel?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[46px] items-center justify-between gap-3 border-b border-slate-200 px-3.5">
        <h3 className="text-[15px] font-black tracking-[-0.015em] text-slate-950">{title}</h3>
        {actionLabel ? <span className="text-[11px] font-black text-red-700">{actionLabel}</span> : null}
      </div>
      <div className="divide-y divide-slate-100 px-3.5 py-1.5">
        {rows.length ? rows.map((row) => {
          const tone = normalizeTone(row.tone);
          return (
            <div className="flex items-center gap-2.5 py-2.5" key={row.label}>
              <span className={clsx('h-2 w-2 shrink-0 rounded-full', dotTone[tone])} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[12px] font-bold text-slate-900">{row.label}</p>
                {row.caption ? <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold text-slate-500">{row.caption}</p> : null}
              </div>
              {row.value !== undefined ? <span className="number max-w-[96px] shrink-0 text-right text-[12px] font-black text-slate-700">{row.value}</span> : null}
            </div>
          );
        }) : <p className="py-5 text-[13px] font-semibold text-slate-500">Chưa có dữ liệu.</p>}
      </div>
    </section>
  );
}
