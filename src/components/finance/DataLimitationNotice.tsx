import { Card, CardTitle } from '@/components/ui/Card';
import { ReportTable } from '@/components/report/ReportTable';

export function DataLimitationNotice({ rows }: { rows: string[][] }) {
  if (!rows.length) return null;
  return (
    <Card>
      <CardTitle>Giới hạn dữ liệu cần xử lý trước khi chốt</CardTitle>
      <p className="mt-2 text-sm text-black/60">Các giới hạn này không phải lỗi hiển thị. Đây là cơ chế chặn kết luận sai khi thiếu nguồn hoặc có khoản chưa đủ bản chất kế toán.</p>
      <div className="mt-3">
        <ReportTable headers={['Nhóm', 'Giới hạn dữ liệu']} rows={rows} />
      </div>
    </Card>
  );
}
