import { clsx } from 'clsx';
import type { Status } from '@/lib/report-types';

const iconTone: Record<Status, string> = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-orange-50 text-orange-700 ring-orange-100',
  danger: 'bg-rose-50 text-rose-700 ring-rose-100',
  neutral: 'bg-slate-50 text-slate-600 ring-slate-100'
};

const valueTone: Record<Status, string> = {
  good: 'text-emerald-700',
  warning: 'text-slate-950',
  danger: 'text-rose-700',
  neutral: 'text-slate-950'
};

const labelTone: Record<Status, string> = {
  good: 'text-emerald-700',
  warning: 'text-orange-700',
  danger: 'text-rose-700',
  neutral: 'text-slate-500'
};

export function ErpKpiCard({
  label,
  value,
  hint,
  trend,
  status = 'neutral',
  icon
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  status?: Status;
  icon?: string;
}) {
  return (
    <article className="min-h-[84px] rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-2 min-h-[14px] text-[10px] font-black uppercase tracking-wide text-slate-600">{label}</p>
          <div className={clsx('number mt-1 break-words text-[21px] font-black leading-none tracking-[-0.035em]', valueTone[status])}>{value}</div>
        </div>
        <span className={clsx('grid h-7 w-7 shrink-0 place-items-center rounded-lg text-center text-[9px] font-black leading-none ring-1', iconTone[status])}>{icon ?? label.slice(0, 1)}</span>
      </div>
      <p className={clsx('mt-2 line-clamp-1 text-[10px] font-bold', labelTone[status])}>{trend ?? hint ?? 'Theo dữ liệu hiện có'}</p>
    </article>
  );
}
