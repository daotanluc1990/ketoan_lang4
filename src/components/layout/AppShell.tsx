'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalFilterBar } from './GlobalFilterBar';
import { LoadingState } from '@/components/ui/LoadingState';
import { OverviewPilotShell } from '@/components/erp-pilot/OverviewPilotShell';
import type { AuthUser } from '@/lib/auth/auth-types';

const COLLAPSE_KEY = 'ctl-ceo-sidebar-collapsed';
const PILOT_ROUTES = new Set([
  '/tong-quan',
  '/pl-tuan',
  '/dong-tien',
  '/can-doi',
  '/du-toan',
  '/that-thoat-chi-tiet',
  '/ban-lam-viec-ke-toan',
  '/import-nhap-lieu',
  '/cai-dat-bot'
]);

function readStoredBool(key: string, fallback: boolean) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => readStoredBool(COLLAPSE_KEY, false));
  const isLoginPage = pathname === '/login';
  const isPilotRoute = PILOT_ROUTES.has(pathname);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(() => !isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok || !payload?.authenticated || !payload?.user) {
          const nextPath = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?next=${nextPath}`;
          return;
        }
        setUser(payload.user);
      })
      .catch(() => {
        if (!active) return;
        const nextPath = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?next=${nextPath}`;
      })
      .finally(() => {
        if (active) setCheckingAuth(false);
      });

    return () => {
      active = false;
    };
  }, [isLoginPage]);

  const toggleCollapsed = () => {
    setCollapsed((current: boolean) => {
      const next = !current;
      try { window.localStorage.setItem(COLLAPSE_KEY, String(next)); } catch {}
      return next;
    });
  };

  const contentPadding = useMemo(() => (collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'), [collapsed]);

  if (isLoginPage) return <>{children}</>;

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <LoadingState label="Đang kiểm tra đăng nhập trước khi mở dữ liệu CEO/Kế toán..." />
      </div>
    );
  }

  if (isPilotRoute) {
    return <OverviewPilotShell user={user}>{children}</OverviewPilotShell>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <div className={clsx('min-h-screen transition-[padding] duration-200', contentPadding)}>
        <TopBar user={user} />
        <GlobalFilterBar />
        <main className="w-full px-2 py-2 sm:px-3 lg:px-3.5">
          {children}
        </main>
      </div>
    </div>
  );
}
