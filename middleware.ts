import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env/server-env';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/check',
  '/api/health'
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isStaticPath(pathname: string) {
  return pathname.startsWith('/_next/') || pathname === '/favicon.ico' || pathname === '/robots.txt' || pathname === '/sitemap.xml';
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

function unauthorizedJson() {
  return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập để sử dụng chức năng này.' }, { status: 401 });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isStaticPath(pathname)) return NextResponse.next();

  const env = getServerEnv();
  if (!env.authEnabled) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = await verifySessionToken(token);

  if (pathname === '/login') {
    if (user) return NextResponse.redirect(new URL('/tong-quan', request.url));
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  if (!user) {
    if (pathname.startsWith('/api/')) return unauthorizedJson();
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
