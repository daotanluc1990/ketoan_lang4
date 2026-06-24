import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { analyzeReportWithAi } from '@/lib/ai/agent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function actorFromUser(user: { displayName: string; username: string; role: string }) {
  return `${user.displayName} (${user.role})`;
}

async function handleAnalyze(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  try {
    const data = await analyzeReportWithAi(request.nextUrl.searchParams);
    await writeAuditLog({ eventType: AUDIT_EVENTS.AI_REPORT_ANALYSIS, actor: actorFromUser(auth.user), role: auth.user.role, target: 'CEO_REPORT_AI', note: 'AI Agent phân tích báo cáo theo quyền đăng nhập.' }).catch(() => null);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'AI Agent không phân tích được.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleAnalyze(request);
}

export async function GET(request: NextRequest) {
  return handleAnalyze(request);
}
