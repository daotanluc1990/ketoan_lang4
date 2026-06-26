import { clsx } from 'clsx';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx('rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:p-3.5', className)}>{children}</section>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[12px] font-black uppercase tracking-[0.08em] text-slate-900 md:text-[13px]">{children}</h3>;
}
