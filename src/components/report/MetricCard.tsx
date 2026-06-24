import { clsx } from 'clsx';
import type { Status } from '@/lib/report-types';
import { StatusBadge } from './StatusBadge';

export function MetricCard({ label, value, hint, trend, status = 'neutral', compact = false }: { label: string; value: string; hint?: string; trend?: string; status?: Status; compact?: boolean }) {
  const trendTone = status === 'good' ? 'text-emerald-700' : status === 'danger' ? 'text-red-700' : status === 'warning' ? 'text-amber-800' : 'text-black/55';
  return (
    <div className={clsx('rounded-xl bg-white shadow-soft ring-1 ring-black/5', compact ? 'p-3' : 'p-3.5')}>
      <div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-xs font-bold uppercase tracking-wide text-black/50">{label}</p><StatusBadge status={status} /></div>
      <div className="number mt-2 text-xl font-extrabold leading-tight text-lang-brown md:text-2xl">{value}</div>
      {trend ? <p className={clsx('mt-1 text-[11px] font-bold leading-4', trendTone)}>{trend}</p> : null}
      {hint ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-black/55">{hint}</p> : null}
    </div>
  );
}
