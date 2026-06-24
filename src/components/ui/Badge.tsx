import { clsx } from 'clsx';

const variants = { good: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-800', danger: 'bg-red-100 text-red-700', neutral: 'bg-stone-100 text-stone-700' };

export function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: keyof typeof variants }) {
  return <span className={clsx('inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold', variants[variant])}>{children}</span>;
}
