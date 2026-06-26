import { clsx } from 'clsx';
import type { Status } from '@/lib/report-types';
import { StatusBadge } from './StatusBadge';

export function MetricCard({
  label,
  value,
  hint,
  trend,
  status = 'neutral',
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  status?: Status;
  compact?: boolean;
}) {
  const accent =
    status === 'good'
      ? 'border-l-emerald-500'
      : status === 'danger'
        ? 'border-l-red-600'
        : status === 'warning'
          ? 'border-l-amber-500'
          : 'border-l-slate-300';
  const trendTone = status === 'good' ? 'text-emerald-700' : status === 'danger' ? 'text-red-700' : status === 'warning' ? 'text-amber-800' : 'text-slate-500';

  return (
    <div className={clsx('rounded-xl border border-slate-200 border-l-4 bg-white shadow-sm', accent, compact ? 'min-h-[82px] p-2.5' : 'min-h-[96px] p-3')}>
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-1 text-[10px] font-black uppercase tracking-wide text-slate-500 md:text-[11px]">{label}</p>
        <StatusBadge status={status} />
      </div>
      <div className="number mt-1 truncate text-[23px] font-black leading-none text-slate-950 md:text-[27px]">{value}</div>
      {trend ? <p className={clsx('mt-1 line-clamp-1 text-[11px] font-bold leading-4', trendTone)}>{trend}</p> : null}
      {!compact && hint ? <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-500 md:text-xs">{hint}</p> : null}
    </div>
  );
}
