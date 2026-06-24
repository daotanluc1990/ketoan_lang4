import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { AuditEventType } from './audit-events';

export async function writeAuditLog(event: {
  eventType: AuditEventType;
  actor: string;
  role?: string;
  target: string;
  before?: unknown;
  after?: unknown;
  note?: string;
}) {
  const store = getDataStore();
  await store.append(SHEET_NAMES.AUDIT_LOG, [
    {
      'ID': `AUDIT-${Date.now()}`,
      'Thời gian': new Date().toISOString(),
      'Người dùng': event.actor,
      'Vai trò': event.role ?? 'system',
      'Hành động': event.eventType,
      'Đối tượng': event.target,
      'Trước': event.before ? JSON.stringify(event.before) : '',
      'Sau': event.after ? JSON.stringify(event.after) : '',
      'Ghi chú': event.note ?? '',
      'IP/Thiết bị': 'server'
    }
  ]);
}
