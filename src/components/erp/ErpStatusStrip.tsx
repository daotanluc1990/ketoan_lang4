import { clsx } from 'clsx';

const toneClass = {
  danger: 'text-rose-700 bg-rose-50 ring-rose-100',
  warning: 'text-orange-700 bg-orange-50 ring-orange-100',
  good: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
  neutral: 'text-slate-600 bg-slate-50 ring-slate-100'
};

type Tone = keyof typeof toneClass;

function normalizeTone(tone?: string): Tone {
  return tone === 'danger' || tone === 'warning' || tone === 'good' || tone === 'neutral' ? tone : 'neutral';
}

export function ErpStatusStrip({ items }: { items: Array<{ label: string; value: string | number; tone?: string; icon?: string }> }) {
  return (
    <section className="grid overflow-hidden rounded-2xl border border-amber-200 bg-white md:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => {
        const tone = normalizeTone(item.tone);
        return (
          <div key={item.label} className={clsx('flex min-h-[62px] items-center gap-2.5 px-3 py-2.5', index ? 'border-t border-amber-100 md:border-l md:border-t-0' : '')}>
            <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-xl text-center text-[10px] font-black leading-none ring-1', toneClass[tone])}>{item.icon ?? '•'}</span>
            <div className="min-w-0">
              <p className="line-clamp-1 text-[11px] font-black text-slate-600">{item.label}</p>
              <p className={clsx('number mt-0.5 line-clamp-1 text-xl font-black leading-none', tone === 'good' ? 'text-emerald-700' : tone === 'danger' ? 'text-rose-700' : tone === 'warning' ? 'text-orange-600' : 'text-slate-900')}>{item.value}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
