import { NextResponse } from 'next/server';
import { refreshReportSnapshots } from '@/lib/reports/cached-fast-page-reports';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const result = await refreshReportSnapshots({});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Report prewarm failed' }, { status: 500 });
  }
}
