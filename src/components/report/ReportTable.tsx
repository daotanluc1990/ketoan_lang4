import { StatusBadge } from './StatusBadge';

const statusWords = new Set(['Tốt', 'Đạt', 'Đã xong', 'Ổn', 'Cảnh báo', 'Cần kiểm', 'Cần đối chiếu', 'Đang làm', 'Chưa đủ dữ liệu', 'Có lỗi', 'Nguy hiểm', 'Chưa thể chốt', 'Không import', 'Cần CEO duyệt', 'Cần kiểm tra', 'Có', 'Không']);

export function ReportTable({ headers, rows, maxHeight = 'max-h-[320px]' }: { headers: string[]; rows: string[][]; maxHeight?: string }) {
  const safeRows = rows.length ? rows : [headers.map((_, index) => (index === 0 ? 'Chưa có dữ liệu' : '—'))];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="min-w-full divide-y divide-slate-100 text-[11px] md:text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left uppercase tracking-wide text-slate-600"><tr>{headers.map((h) => <th className="whitespace-nowrap px-2.5 py-1.5 font-black" key={h}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {safeRows.map((row, idx) => <tr key={idx} className="hover:bg-amber-50/60">{row.map((cell, cellIdx) => <td className={cellIdx > 1 ? 'number max-w-[220px] truncate whitespace-nowrap px-2.5 py-1.5 text-slate-700' : 'max-w-[260px] truncate px-2.5 py-1.5 font-medium text-slate-800'} key={`${idx}-${cellIdx}`}>{statusWords.has(cell) ? <StatusBadge status={cell} /> : cell}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
