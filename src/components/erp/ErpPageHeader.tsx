import { ErpStatusBadge } from './ErpStatusBadge';

export function ErpPageHeader({
  title,
  status
}: {
  title: string;
  eyebrow?: string;
  description: string;
  status: string;
  meta?: string[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="truncate text-[19px] font-black leading-tight tracking-[-0.03em] text-slate-950 md:text-[22px]">{title}</h1>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5">
          <span className="text-[8px] font-black uppercase tracking-wide text-slate-500">Trạng thái</span>
          <ErpStatusBadge status={status} />
        </div>
      </div>
    </section>
  );
}
