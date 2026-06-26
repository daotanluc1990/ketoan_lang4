import { ErpStatusBadge } from './ErpStatusBadge';

export function ErpPageHeader({
  title,
  eyebrow = 'ERP Mini · Báo cáo kế toán',
  description,
  status,
  meta = []
}: {
  title: string;
  eyebrow?: string;
  description: string;
  status: string;
  meta?: string[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-700">{eyebrow}</p>
          <h1 className="mt-0.5 truncate text-2xl font-black leading-tight tracking-[-0.035em] text-slate-950 md:text-[30px]">{title}</h1>
          <p className="mt-0.5 text-[13px] font-semibold text-slate-500">{description}</p>
          {meta.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
              {meta.map((item) => <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">{item}</span>)}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Trạng thái</span>
          <ErpStatusBadge status={status} />
        </div>
      </div>
    </section>
  );
}
