import { clsx } from 'clsx';

export function Button({ children, variant = 'primary', onClick, disabled = false }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger'; onClick?: () => void; disabled?: boolean }) {
  return <button className={clsx('h-9 rounded-lg px-3 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60', variant === 'primary' && 'bg-lang-red text-white hover:bg-lang-redDark', variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50', variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700')} type="button" onClick={onClick} disabled={disabled}>{children}</button>;
}
