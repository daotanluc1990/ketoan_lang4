import { Card, CardTitle } from '@/components/ui/Card';

export function ChartCard({ title, description, items, type = 'bar' }: { title: string; description?: string; items: Array<{ label: string; value: number; caption?: string }>; type?: 'bar' | 'line' | 'status' }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><CardTitle>{title}</CardTitle>{description ? <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-black/55">{description}</p> : null}</div>
        <span className="shrink-0 rounded-full bg-lang-cream px-2.5 py-1 text-[10px] font-bold text-lang-brown">{type === 'line' ? 'Trend' : type === 'status' ? 'Status' : 'Bar'}</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold text-lang-brown">{item.label}</span><span className="number shrink-0 text-black/60">{item.caption ?? item.value}</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-lang-cream"><div className="h-full rounded-full bg-lang-red" style={{ width: `${Math.max(8, Math.round((item.value / max) * 100))}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}
