import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, createSessionToken, getAuthSessionMaxAgeSeconds, redactUserForClient, validateLogin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const login = await validateLogin(username, password);
  if (!login.ok) {
    return NextResponse.json({ ok: false, code: login.code, message: login.message }, { status: login.code === 'AUTH_NOT_CONFIGURED' ? 500 : 401 });
  }

  const token = await createSessionToken(login.user);
  const response = NextResponse.json({ ok: true, user: redactUserForClient(login.user) });
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getAuthSessionMaxAgeSeconds()
  });
  return response;
}
