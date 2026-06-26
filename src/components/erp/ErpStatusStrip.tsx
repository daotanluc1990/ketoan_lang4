import { clsx } from 'clsx';

const toneClass = {
  danger: 'text-rose-700 bg-rose-50 ring-rose-100',
  warning: 'text-orange-700 bg-orange-50 ring-orange-100',
  good: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
  neutral: 'text-slate-600 bg-slate-50 ring-slate-100'
};

type Tone = keyof typeof toneClass;

export function ErpStatusStrip({ items }: { items: Array<{ label: string; value: string | number; tone?: Tone; icon?: string }> }) {
  return (
    <section className="grid overflow-hidden rounded-2xl border border-amber-200 bg-white md:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => (
        <div key={item.label} className={clsx('flex min-h-[78px] items-center gap-3 px-4 py-3', index ? 'border-t border-amber-100 md:border-l md:border-t-0' : '')}>
          <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-black ring-1', toneClass[item.tone ?? 'neutral'])}>{item.icon ?? '•'}</span>
          <div className="min-w-0">
            <p className="line-clamp-1 text-[12px] font-black text-slate-600">{item.label}</p>
            <p className={clsx('number mt-1 text-2xl font-black leading-none', item.tone === 'good' ? 'text-emerald-700' : item.tone === 'danger' ? 'text-rose-700' : item.tone === 'warning' ? 'text-orange-600' : 'text-slate-900')}>{item.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
