import { Card, CardTitle } from '@/components/ui/Card';
import { ReportTable } from '@/components/report/ReportTable';

export function FormulaEvidencePanel({ rows }: { rows: string[][] }) {
  if (!rows.length) return null;
  return (
    <Card>
      <CardTitle>Nguồn & công thức kiểm chứng</CardTitle>
      <p className="mt-2 text-sm text-black/60">Mỗi chỉ số tài chính phải truy ngược được nguồn dữ liệu, số dòng, kỳ lọc và công thức. Gemini không tạo số trong phần này.</p>
      <div className="mt-3">
        <ReportTable headers={['Chỉ số', 'Nguồn', 'Số dòng', 'Công thức', 'Kỳ', 'Trạng thái', 'Ghi chú']} rows={rows} />
      </div>
    </Card>
  );
}
