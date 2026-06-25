import { StatusBadge } from '@/components/report/StatusBadge';

export function PageHeader({ title, description, status }: { title: string; description: string; status?: string }) {
  return (
    <div className="mb-2 flex flex-col justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-soft ring-1 ring-black/5 md:flex-row md:items-center lg:px-5 lg:py-3.5">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-lang-red">CEO Report Dashboard</p>
        <h2 className="mt-0.5 text-lg font-extrabold leading-tight text-lang-brown md:text-xl lg:text-[26px]">{title}</h2>
        <p className="mt-0.5 max-w-5xl truncate text-xs leading-5 text-black/60 md:text-sm">{description}</p>
      </div>
      {status ? <div className="shrink-0"><StatusBadge status={status} /></div> : null}
    </div>
  );
}
