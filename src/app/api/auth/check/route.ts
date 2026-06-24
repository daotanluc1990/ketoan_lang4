import { NextResponse } from 'next/server';
import { getEnvChecklist } from '@/lib/env/server-env';
import { isAuthConfigured, isAuthEnabled } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: isAuthConfigured(),
    mode: 'server_session_rbac',
    authEnabled: isAuthEnabled(),
    authConfigured: isAuthConfigured(),
    checklist: getEnvChecklist().filter((item) => item.name.startsWith('AUTH_')).map((item) => ({ name: item.name, configured: item.configured, requiredFor: item.requiredFor }))
  }, { status: isAuthConfigured() ? 200 : 503 });
}

export async function POST() {
  return GET();
}
