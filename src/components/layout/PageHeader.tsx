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
    <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:px-4">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-700">Cơm Tấm Làng · ERP mini</p>
        <h2 className="mt-0.5 truncate text-lg font-black leading-tight text-slate-950 md:text-xl lg:text-2xl">{title}</h2>
        {description ? <p className="sr-only">{description}</p> : null}
      </div>
      {status ? <div className="shrink-0"><StatusBadge status={status} /></div> : null}
    </div>
  );
}
