import { clsx } from 'clsx';

const variants = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600'
};

export function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: keyof typeof variants }) {
  return <span className={clsx('inline-flex h-5 items-center whitespace-nowrap rounded-full border px-2 text-[10px] font-extrabold leading-none', variants[variant])}>{children}</span>;
}
