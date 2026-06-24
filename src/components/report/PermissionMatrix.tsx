import { Card, CardTitle } from '@/components/ui/Card';
import { ReportTable } from './ReportTable';

const permissionRows = [
  ['CEO', 'Xem tất cả báo cáo', 'Duyệt/chốt báo cáo, gửi bot, xem health', 'Toàn hệ thống', 'Không nhập secret vào code/Google Sheet'],
  ['Kế toán', 'Xem dashboard và bàn làm việc kế toán', 'Import, đối soát, gửi báo cáo Telegram khi đã đăng nhập', 'Không sửa cấu hình hệ thống/env', 'Không xóa dữ liệu hoặc đổi schema Google Sheet']
];

export function PermissionMatrix() {
  return (
    <Card>
      <CardTitle>Phân quyền vận hành</CardTitle>
      <p className="mt-2 text-sm text-black/60">V4.6 strict: chỉ CEO và Kế toán. Quyền không còn chọn bằng giao diện; server kiểm session và role trước khi đọc/ghi dữ liệu, gọi AI hoặc gửi Telegram.</p>
      <div className="mt-3">
        <ReportTable headers={['Vai trò', 'Được xem', 'Được làm', 'Giới hạn', 'Cấm']} rows={permissionRows} />
      </div>
    </Card>
  );
}
