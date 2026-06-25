'use client';

import { Badge } from '@/components/ui/Badge';
import type { AuthUser } from '@/lib/auth/auth-types';

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
  window.location.href = '/login';
}

async function sendTelegramReport() {
  const confirmed = window.confirm('Gửi báo cáo Telegram thật bằng tài khoản đang đăng nhập?');
  if (!confirmed) return;
  const response = await fetch('/api/telegram/send-test', { method: 'POST' }).catch(() => null);
  if (!response) {
    window.alert('Không kết nối được API Telegram.');
    return;
  }
  const payload = await response.json().catch(() => null);
  window.alert(payload?.message ?? (response.ok ? 'Đã gửi Telegram.' : 'Không gửi Telegram được.'));
}

export function TopBar({ user }: { user: AuthUser }) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-lang-cream/95 backdrop-blur">
      <div className="flex min-h-11 w-full flex-wrap items-center justify-between gap-1.5 px-3 py-1 sm:px-4 lg:px-4">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-lang-red">Cơm Tấm Làng</p>
          <h1 className="truncate text-sm font-extrabold leading-5 text-lang-brown">Báo cáo CEO</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Badge variant="warning">V4.6</Badge>
          <div className="rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold leading-none shadow-sm">
            {user.displayName} · {user.role}
          </div>
          <button className="h-7 rounded-md bg-lang-red px-2.5 text-[11px] font-semibold text-white shadow-sm hover:bg-lang-redDark" type="button" onClick={sendTelegramReport}>Gửi Bot</button>
          <button className="h-7 rounded-md border border-black/10 bg-white px-2.5 text-[11px] font-semibold shadow-sm hover:bg-black/5" type="button" onClick={logout}>Đăng xuất</button>
        </div>
      </div>
    </header>
  );
}
