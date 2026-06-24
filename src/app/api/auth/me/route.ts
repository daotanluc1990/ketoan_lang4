import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, isAuthConfigured, isAuthEnabled, redactUserForClient, verifySessionToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json({ ok: false, authenticated: false, authEnabled: isAuthEnabled(), authConfigured: isAuthConfigured() }, { status: 401 });
  }
  return NextResponse.json({ ok: true, authenticated: true, authEnabled: isAuthEnabled(), authConfigured: isAuthConfigured(), user: redactUserForClient(user) });
}
