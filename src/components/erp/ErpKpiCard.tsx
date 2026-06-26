import { clsx } from 'clsx';
import type { Status } from '@/lib/report-types';
import { ErpStatusBadge } from './ErpStatusBadge';

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
    <article className="min-h-[96px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="line-clamp-2 min-h-[16px] text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</p>
          <div className={clsx('number mt-1.5 break-words text-[24px] font-black leading-none tracking-[-0.04em]', valueTone[status])}>{value}</div>
        </div>
        <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-xl text-center text-[10px] font-black leading-none ring-1', iconTone[status])}>{icon ?? label.slice(0, 1)}</span>
      </div>
      <div className="mt-3 flex min-h-6 items-center justify-between gap-2">
        <p className={clsx('line-clamp-1 min-w-0 text-[11px] font-bold', status === 'danger' ? 'text-rose-700' : status === 'warning' ? 'text-orange-700' : 'text-slate-500')}>{trend ?? hint ?? 'Theo dữ liệu hiện có'}</p>
        <ErpStatusBadge status={status === 'good' ? 'Tốt' : status === 'danger' ? 'Nguy hiểm' : status === 'warning' ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      </div>
    </article>
  );
}
