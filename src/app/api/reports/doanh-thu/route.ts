import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    ok: true,
    phase: '0-4 foundation',
    message: 'Endpoint reports/doanh-thu đã được dựng khung. Logic thật triển khai ở phase sau.',
    data: null
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO']);
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    ok: false,
    message: 'Chức năng POST cho reports/doanh-thu chưa bật ở Phase 0–4.'
  }, { status: 501 });
}
