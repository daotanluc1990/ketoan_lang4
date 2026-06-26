import { clsx } from 'clsx';

const toneMap: Record<string, string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600'
};

function toneFor(status: string) {
  if (['Tốt', 'Đạt', 'Đã xử lý', 'Đã chốt', 'good'].includes(status)) return 'good';
  if (['Nguy hiểm', 'Có lỗi', 'Tồn âm', 'danger'].includes(status)) return 'danger';
  if (['Chưa đủ dữ liệu', 'Chờ dữ liệu', 'neutral'].includes(status)) return 'neutral';
  return 'warning';
}

export function ErpStatusBadge({ status }: { status: string }) {
  const tone = toneFor(status);
  return <span className={clsx('inline-flex min-h-5 items-center rounded-md border px-2 py-0.5 text-[10px] font-black leading-none', toneMap[tone])}>{status}</span>;
}
