export function LoadingState({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  return <div className="animate-pulse rounded-2xl bg-white p-4 text-sm text-black/60 shadow-soft">{label}</div>;
}
