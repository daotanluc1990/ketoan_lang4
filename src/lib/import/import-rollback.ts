import { writeAuditLog } from '@/lib/audit/audit-log';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';

export async function rollbackImport(input: { maLanImport: string; actor: string; reason: string }) {
  // Production Data Strict: do not delete or mutate imported rows automatically.
  // A rollback request is recorded in the V5 AUDIT_LOG so an owner can review
  // and decide whether to reverse the import with a controlled recovery step.
  await writeAuditLog({
    eventType: AUDIT_EVENTS.IMPORT_ROLLBACK,
    actor: input.actor,
    target: input.maLanImport,
    note: `Rollback requested: ${input.reason}`
  });

  return {
    ok: true,
    status: 'audit_logged',
    message: 'Đã ghi nhận yêu cầu hủy lần import vào AUDIT_LOG. Chưa xóa dữ liệu tự động để tránh mất dữ liệu vận hành.'
  };
}
