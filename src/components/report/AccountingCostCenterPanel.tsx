import { Card, CardTitle } from '@/components/ui/Card';
import { ReportTable } from './ReportTable';

export function AccountingCostCenterPanel({ rows, maxHeight = 'max-h-[360px]' }: { rows: string[][]; maxHeight?: string }) {
  return (
    <Card>
      <CardTitle>Phân bổ chi phí</CardTitle>
      <div className="mt-2">
        <ReportTable
          headers={['Đơn vị', 'Nhóm', 'Số tiền', 'Xử lý', 'Tỷ trọng', 'Trạng thái', 'Hành động']}
          rows={rows}
          maxHeight={maxHeight}
        />
      </div>
    </Card>
  );
}
