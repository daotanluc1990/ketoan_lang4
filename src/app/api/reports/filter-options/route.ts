import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { buildSnapshotFilterOptions } from '@/lib/reports/cached-fast-page-reports';

export const revalidate = 300;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  try {
    const options = await buildSnapshotFilterOptions();
    return NextResponse.json({ ok: true, options }, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Không đọc được danh sách bộ lọc từ dữ liệu thật.' }, { status: 500 });
  }
}
