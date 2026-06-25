import { Card, CardTitle } from '@/components/ui/Card';

export function ChartCard({
  title,
  description,
  items,
  type = 'bar',
}: {
  title: string;
  description?: string;
  items: Array<{ label: string; value: number; caption?: string }>;
  type?: 'bar' | 'line' | 'status';
}) {
  const safeItems = items.length ? items : [{ label: 'Chưa có dữ liệu', value: 0, caption: '—' }];
  const max = Math.max(...safeItems.map((item) => item.value), 1);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-black/50 md:text-xs">
              {description}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-lang-cream px-2 py-0.5 text-[9px] font-extrabold uppercase text-lang-brown">
          {type === 'line' ? 'Trend' : type === 'status' ? 'Status' : 'Bar'}
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        {safeItems.slice(0, 6).map((item) => {
          const width = `${Math.max(8, Math.round((item.value / max) * 100))}%`;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-2 text-[11px] leading-4 md:text-xs">
                <span className="truncate font-semibold text-lang-brown">{item.label}</span>
                <span className="number shrink-0 text-black/60">{item.caption ?? item.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lang-cream">
                <div className="h-full rounded-full bg-lang-red" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
