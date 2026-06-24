import { NextRequest, NextResponse } from 'next/server';
import { AUTH_ALLOWED_ROLES, AUTH_COOKIE_NAME, verifySessionToken } from './session';
import type { AppRole, SessionUser } from './auth-types';

type RequireAuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

function deny(status: 401 | 403, message: string) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function requireAuth(request: NextRequest, allowedRoles: AppRole[] = AUTH_ALLOWED_ROLES): Promise<RequireAuthResult> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = await verifySessionToken(token);
  if (!user) return { ok: false, response: deny(401, 'Bạn cần đăng nhập để sử dụng chức năng này.') };
  if (!allowedRoles.includes(user.role)) return { ok: false, response: deny(403, 'Bạn không có quyền sử dụng chức năng này.') };
  return { ok: true, user };
}
