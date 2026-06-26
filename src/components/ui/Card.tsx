import { clsx } from 'clsx';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx('rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.045)] lg:p-3.5', className)}>{children}</section>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[12px] font-black uppercase tracking-[0.11em] text-slate-800 md:text-[13px]">{children}</h3>;
}
