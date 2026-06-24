import { StatusBadge } from './StatusBadge';

const statusWords = new Set(['Tốt', 'Đạt', 'Đã xong', 'Ổn', 'Cảnh báo', 'Cần kiểm', 'Cần đối chiếu', 'Đang làm', 'Chưa đủ dữ liệu', 'Có lỗi', 'Nguy hiểm', 'Chưa thể chốt', 'Không import', 'Cần CEO duyệt', 'Cần kiểm tra', 'Có', 'Không']);

export function ReportTable({ headers, rows, maxHeight = 'max-h-[360px]' }: { headers: string[]; rows: string[][]; maxHeight?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="min-w-full divide-y divide-black/5 text-xs">
          <thead className="sticky top-0 z-10 bg-lang-cream text-left uppercase tracking-wide text-black/60"><tr>{headers.map((h) => <th className="px-3 py-2 font-bold" key={h}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((row, idx) => <tr key={idx} className="hover:bg-lang-cream/60">{row.map((cell, cellIdx) => <td className={cellIdx > 1 ? 'number whitespace-nowrap px-3 py-2' : 'px-3 py-2'} key={`${idx}-${cellIdx}`}>{statusWords.has(cell) ? <StatusBadge status={cell} /> : cell}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
