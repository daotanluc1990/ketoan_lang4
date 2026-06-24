import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';

export const dynamic = 'force-dynamic';

function actorFromUser(user: { displayName: string; username: string; role: string }) {
  return `${user.displayName} (${user.role})`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body?.maLech || !body?.hanhDong) {
    return NextResponse.json({ ok: false, message: 'Thiếu mã lệch hoặc hành động xử lý.' }, { status: 400 });
  }
  await writeAuditLog({ eventType: AUDIT_EVENTS.CONFLICT_RESOLVE, actor: actorFromUser(auth.user), role: auth.user.role, target: body.maLech, after: body });
  return NextResponse.json({ ok: true, message: 'Đã ghi nhận xử lý dữ liệu lệch ở audit log. Ghi đè dữ liệu thật sẽ làm ở phase sau theo quyền.' });
}
