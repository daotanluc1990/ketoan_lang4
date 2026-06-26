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
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">{eyebrow}</p>
          <h1 className="mt-1 truncate text-[28px] font-black leading-tight tracking-[-0.045em] text-slate-950 md:text-4xl">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 md:text-base">{description}</p>
          {meta.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-bold text-slate-500">
              {meta.map((item) => <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{item}</span>)}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">Trạng thái</span>
          <ErpStatusBadge status={status} />
        </div>
      </div>
    </section>
  );
}
