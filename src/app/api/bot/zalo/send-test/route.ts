import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ ok: true, mode: 'contract_only', message: 'Zalo chưa bật trong V4.6. Telegram là kênh test thật trước.' });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO']);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ ok: false, message: 'Zalo chưa được triển khai ở V4.6. Không gửi thật để tránh cấu hình sai kênh.' }, { status: 501 });
}
