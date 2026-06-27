import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type SectionTone = 'hero' | 'kpi' | 'summary' | 'action' | 'risk' | 'table' | 'neutral';

const frameTone: Record<SectionTone, string> = {
  hero: 'border-slate-200 bg-white shadow-sm',
  kpi: 'border-slate-200 bg-slate-50/70 shadow-sm',
  summary: 'border-amber-200 bg-amber-50/45 shadow-sm',
  action: 'border-red-100 bg-red-50/40 shadow-sm',
  risk: 'border-orange-200 bg-orange-50/50 shadow-sm',
  table: 'border-slate-200 bg-white shadow-sm',
  neutral: 'border-slate-200 bg-white shadow-sm'
};

const accentTone: Record<SectionTone, string> = {
  hero: 'bg-red-700',
  kpi: 'bg-slate-400',
  summary: 'bg-amber-500',
  action: 'bg-red-700',
  risk: 'bg-orange-500',
  table: 'bg-slate-300',
  neutral: 'bg-slate-300'
};

export function ErpSectionFrame({
  tone = 'neutral',
  title,
  description,
  action,
  children,
  className,
  contentClassName
}: {
  tone?: SectionTone;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  void description;
  return (
    <section className={clsx('overflow-hidden rounded-2xl border', frameTone[tone], className)}>
      {(title || action) ? (
        <div className="flex min-h-[38px] items-center justify-between gap-3 border-b border-black/5 bg-white/55 px-3.5 py-1.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={clsx('h-2 w-2 rounded-full', accentTone[tone])} />
              {title ? <h2 className="truncate text-[13px] font-black uppercase tracking-[0.08em] text-slate-800">{title}</h2> : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={clsx('p-3', contentClassName)}>{children}</div>
    </section>
  );
}
