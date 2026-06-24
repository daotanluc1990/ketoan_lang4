import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { getReportFilterOptions } from '@/lib/reports/report-aggregator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  try {
    const options = await getReportFilterOptions();
    return NextResponse.json({ ok: true, options });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Không đọc được danh sách bộ lọc từ dữ liệu thật.' }, { status: 500 });
  }
}
