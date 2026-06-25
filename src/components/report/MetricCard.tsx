import { clsx } from 'clsx';
import type { Status } from '@/lib/report-types';
import { StatusBadge } from './StatusBadge';

export function MetricCard({ label, value, hint, trend, status = 'neutral', compact = false }: { label: string; value: string; hint?: string; trend?: string; status?: Status; compact?: boolean }) {
  const trendTone = status === 'good' ? 'text-emerald-700' : status === 'danger' ? 'text-red-700' : status === 'warning' ? 'text-amber-800' : 'text-black/55';
  return (
    <div className={clsx('rounded-xl bg-white shadow-soft ring-1 ring-black/5', compact ? 'min-h-[98px] p-3' : 'min-h-[110px] p-3.5')}>
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-1 text-[11px] font-extrabold uppercase tracking-wide text-black/50 md:text-xs">{label}</p>
        <StatusBadge status={status} />
      </div>
      <div className="number mt-1.5 truncate text-2xl font-black leading-none text-lang-brown md:text-[28px] lg:text-[30px]">{value}</div>
      {trend ? <p className={clsx('mt-1 line-clamp-1 text-[11px] font-extrabold leading-4 md:text-xs', trendTone)}>{trend}</p> : null}
      {hint ? <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-black/50 md:text-xs">{hint}</p> : null}
    </div>
  );
}
