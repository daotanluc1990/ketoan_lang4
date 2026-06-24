import { StatusBadge } from '@/components/report/StatusBadge';

export function PageHeader({ title, description, status }: { title: string; description: string; status?: string }) {
  return (
    <div className="mb-3 flex flex-col justify-between gap-2 rounded-xl bg-white p-4 shadow-soft ring-1 ring-black/5 md:flex-row md:items-center">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lang-red">CEO Report Dashboard</p>
        <h2 className="mt-1 text-xl font-bold text-lang-brown md:text-2xl">{title}</h2>
        <p className="mt-1 max-w-4xl text-xs leading-5 text-black/60 md:text-sm">{description}</p>
      </div>
      {status ? <StatusBadge status={status} /> : null}
    </div>
  );
}
