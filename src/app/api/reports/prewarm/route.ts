import { NextRequest, NextResponse } from 'next/server';
import { refreshReportSnapshots } from '@/lib/reports/cached-fast-page-reports';

export const runtime = 'nodejs';

function authorized(request: NextRequest) {
  const token = process.env.REPORT_PREWARM_TOKEN;
  if (!token) return false;
  return request.headers.get('x-report-prewarm-token') === token;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await refreshReportSnapshots({});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Report prewarm failed' }, { status: 500 });
  }
}
