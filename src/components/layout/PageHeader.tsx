import { StatusBadge } from '@/components/report/StatusBadge';

export function PageHeader({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status?: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_10px_26px_rgba(15,23,42,0.045)] md:px-4">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lang-red">Cơm Tấm Làng · ERP mini</p>
        <h2 className="mt-0.5 truncate text-lg font-black leading-tight text-slate-900 md:text-xl lg:text-2xl">{title}</h2>
        {description ? <p className="mt-0.5 hidden truncate text-xs font-semibold text-slate-500 md:block">{description}</p> : null}
      </div>
      {status ? <div className="shrink-0"><StatusBadge status={status} /></div> : null}
    </div>
  );
}
