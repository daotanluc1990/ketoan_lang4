import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { sheetsRepository } from '@/lib/google-sheets/sheets-repository';
import { getEnvChecklist } from '@/lib/env/server-env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;
  const health = await sheetsRepository.healthCheck();
  return NextResponse.json({ ok: health.ok, data: health, env: getEnvChecklist().map((item) => ({ name: item.name, configured: item.configured, requiredFor: item.requiredFor })) }, { status: health.ok ? 200 : 503 });
}
