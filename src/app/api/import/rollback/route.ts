import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { rollbackImport } from '@/lib/import/import-rollback';

export const dynamic = 'force-dynamic';

function actorFromUser(user: { displayName: string; username: string; role: string }) {
  return `${user.displayName} (${user.role})`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body?.maLanImport || !body?.reason) {
    return NextResponse.json({ ok: false, message: 'Thiếu mã lần import hoặc lý do hủy.' }, { status: 400 });
  }
  const result = await rollbackImport({ maLanImport: body.maLanImport, reason: body.reason, actor: actorFromUser(auth.user) });
  return NextResponse.json(result);
}
