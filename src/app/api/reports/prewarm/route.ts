import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { refreshReportSnapshots } from '@/lib/reports/cached-fast-page-reports';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;
  try {
    const result = await refreshReportSnapshots({});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Report prewarm failed' }, { status: 500 });
  }
}
