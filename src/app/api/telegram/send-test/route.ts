import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { buildTelegramWeeklyMessage, sendTelegramMessage } from '@/lib/telegram/telegram-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function actorFromUser(user: { displayName: string; username: string; role: string }) {
  return `${user.displayName} (${user.role})`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  try {
    const message = body?.message ? String(body.message) : await buildTelegramWeeklyMessage();
    const result = await sendTelegramMessage(message);
    await writeAuditLog({
      eventType: AUDIT_EVENTS.TELEGRAM_SEND,
      actor: actorFromUser(auth.user),
      role: auth.user.role,
      target: 'TELEGRAM_WEEKLY_REPORT',
      after: { ok: result.ok, mode: result.mode },
      note: result.ok ? 'Đã gửi Telegram từ người dùng đã đăng nhập.' : result.message
    }).catch(() => null);
    return NextResponse.json({ ok: result.ok, data: result, message: result.message }, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Không gửi Telegram test được.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  try {
    const message = await buildTelegramWeeklyMessage();
    await writeAuditLog({ eventType: AUDIT_EVENTS.TELEGRAM_PREVIEW, actor: actorFromUser(auth.user), role: auth.user.role, target: 'TELEGRAM_WEEKLY_REPORT', note: 'Xem trước nội dung Telegram.' }).catch(() => null);
    return NextResponse.json({ ok: true, mode: 'preview_only', message });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Không tạo được message Telegram.' }, { status: 500 });
  }
}
