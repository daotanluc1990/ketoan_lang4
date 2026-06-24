import { Card, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from './StatusBadge';

const steps = [
  { label: 'Nháp', status: 'Đã xong' },
  { label: 'Upload file', status: 'Đã xong' },
  { label: 'Kiểm tra lỗi', status: 'Cảnh báo' },
  { label: 'Đối soát', status: 'Đang làm' },
  { label: 'Chờ chốt', status: 'Chưa thể chốt' },
  { label: 'Gửi CEO/Bot', status: 'Chưa đủ dữ liệu' }
];

export function ReportStatusPanel() {
  return (
    <Card>
      <CardTitle>Trạng thái báo cáo tuần</CardTitle>
      <p className="mt-2 text-sm text-black/60">Kế toán chỉ được chốt khi dữ liệu đạt đủ điều kiện và lỗi nghiêm trọng đã xử lý.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.label} className="rounded-xl border border-black/5 bg-lang-cream/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-black/45">Bước {index + 1}</span>
              <StatusBadge status={step.status} />
            </div>
            <p className="mt-2 font-semibold text-lang-brown">{step.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
