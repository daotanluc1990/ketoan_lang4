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
      <div className="flex min-h-14 w-full flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 lg:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lang-red">Cơm Tấm Làng</p>
          <h1 className="truncate text-base font-bold text-lang-brown">Báo cáo CEO & Bàn làm việc kế toán</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="warning">V4.6 security gate</Badge>
          <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold shadow-sm">
            {user.displayName} · Vai trò: {user.role}
          </div>
          <button className="h-9 rounded-lg bg-lang-red px-3 text-xs font-semibold text-white shadow-sm hover:bg-lang-redDark" type="button" onClick={sendTelegramReport}>Gửi CEO/Bot</button>
          <button className="h-9 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold shadow-sm hover:bg-black/5" type="button" onClick={logout}>Đăng xuất</button>
        </div>
      </div>
    </header>
  );
}
