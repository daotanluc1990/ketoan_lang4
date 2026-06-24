import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  try {
    const report = await buildDashboardReport(request.nextUrl.searchParams);
    return NextResponse.json({
      ok: true,
      tasks: report.dataQuality.tasks,
      rows: report.accountingWorkbenchTaskRows,
      dataQuality: {
        status: report.dataQuality.status,
        score: report.dataQuality.score,
        message: report.dataQuality.message
      },
      filterMetadata: report.filterMetadata
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Không đọc được việc kế toán.' }, { status: 500 });
  }
}
