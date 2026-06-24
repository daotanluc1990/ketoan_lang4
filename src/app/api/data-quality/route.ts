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
      dataQuality: report.dataQuality,
      summaryRows: report.dataQualitySummaryRows,
      matrixRows: report.dataQualityMatrixRows,
      sourceRows: report.dataQualitySourceRows,
      filterMetadata: report.filterMetadata
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Không đọc được Data Quality.' }, { status: 500 });
  }
}
