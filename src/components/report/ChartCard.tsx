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
      <div className="flex items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
          {type === 'line' ? 'Trend' : type === 'status' ? 'Status' : 'Bar'}
        </span>
      </div>
      {description ? <p className="sr-only">{description}</p> : null}

      <div className="mt-2 space-y-1.5">
        {safeItems.slice(0, 7).map((item) => {
          const width = `${Math.max(7, Math.round((item.value / max) * 100))}%`;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-2 text-[11px] leading-4 md:text-xs">
                <span className="truncate font-bold text-slate-800">{item.label}</span>
                <span className="number shrink-0 text-slate-500">{item.caption ?? item.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-red-700" style={{ width }} />
              </div>
            </div>
          );
        })}
        {safeItems.length > 7 ? <p className="text-[10px] font-bold text-slate-500">+{safeItems.length - 7} mục khác trong bảng chi tiết</p> : null}
      </div>
    </Card>
  );
}
