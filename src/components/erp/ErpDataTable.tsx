import { clsx } from 'clsx';
import { ErpStatusBadge } from './ErpStatusBadge';

const statusWords = new Set(['Tốt', 'Đạt', 'Đã xử lý', 'Đã xong', 'Bình thường', 'Dư', 'Cảnh báo', 'Cần kiểm', 'Cần đối chiếu', 'Cần xử lý', 'Đang xử lý', 'Chưa đủ dữ liệu', 'Thiếu dữ liệu', 'Có lỗi', 'Nguy hiểm', 'Thiếu', 'Tồn âm', 'Tạm tính']);

function isNumberCell(value: string) {
  const text = value.trim();
  return Boolean(text.match(/^[-+(]?\d/)) || text.includes('₫') || text.includes('tr') || text.includes('%') || text.includes('M');
}

function rowTone(row: string[]) {
  const text = row.join(' ').toLowerCase();
  if (text.includes('nguy hiểm') || text.includes('tồn âm') || text.includes('có lỗi')) return 'border-l-rose-500';
  if (text.includes('cảnh báo') || text.includes('thiếu')) return 'border-l-orange-400';
  if (text.includes('cần') || text.includes('đang')) return 'border-l-amber-400';
  return 'border-l-transparent';
}

function cellClass(cell: string, cellIndex: number) {
  if (isNumberCell(cell)) return 'number whitespace-nowrap text-right font-black text-slate-800';
  if (statusWords.has(cell)) return 'whitespace-nowrap text-left';
  if (cellIndex <= 1) return 'min-w-[132px] whitespace-normal break-words font-bold text-slate-900';
  return 'min-w-[118px] whitespace-normal break-words text-slate-600';
}

export function ErpDataTable({
  title,
  count,
  headers,
  rows,
  maxHeight = 'max-h-[360px]',
  minWidth = 'min-w-[920px]'
}: {
  title: string;
  count?: string | number;
  headers: string[];
  rows: string[][];
  maxHeight?: string;
  minWidth?: string;
}) {
  const safeRows = rows.length ? rows : [headers.map((_, index) => (index === 0 ? 'Chưa có dữ liệu' : '—'))];
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[46px] items-center justify-between gap-3 border-b border-slate-200 px-3.5">
        <h3 className="text-[15px] font-black tracking-[-0.015em] text-slate-950">{title}</h3>
        {count !== undefined ? <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-red-700 px-1.5 text-[10px] font-black text-white">{count}</span> : null}
      </div>
      <div className={`overflow-auto ${maxHeight}`}>
        <table className={`${minWidth} w-full text-[11px]`}>
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
            <tr>{headers.map((header) => <th className="whitespace-nowrap border-b border-slate-200 px-2.5 py-2.5 font-black" key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {safeRows.map((row, rowIndex) => (
              <tr className={clsx('border-l-4 odd:bg-white even:bg-slate-50/40 hover:bg-red-50/30', rowTone(row))} key={`${title}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td className={clsx('border-b border-slate-100 px-2.5 py-2.5 align-top leading-4', cellClass(cell, cellIndex))} key={`${title}-${rowIndex}-${cellIndex}`}>
                    {statusWords.has(cell) ? <ErpStatusBadge status={cell} /> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50 px-3.5 py-1.5 text-[10px] font-bold text-slate-500">Kéo ngang trong bảng nếu còn nhiều cột.</div>
    </section>
  );
}
