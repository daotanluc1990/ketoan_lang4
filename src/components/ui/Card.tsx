import { clsx } from 'clsx';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx('rounded-xl bg-white p-3.5 shadow-soft ring-1 ring-black/5 lg:p-4', className)}>{children}</section>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-lang-brown md:text-sm">{children}</h3>;
}
