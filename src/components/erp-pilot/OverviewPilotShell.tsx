'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuthUser } from '@/lib/auth/auth-types';

const navGroups = [
  { title: 'Tổng quan & xử lý', items: [{ href: '/tong-quan', icon: '⌂', label: 'Tổng quan kế toán', badge: '17' }, { href: '/ban-lam-viec-ke-toan', icon: '▣', label: 'Bàn làm việc kế toán', badge: '6' }, { href: '/import-nhap-lieu', icon: '⇩', label: 'Nhập liệu & Import' }] },
  { title: 'Báo cáo tài chính quản trị', items: [{ href: '/pl-tuan', icon: '▥', label: 'P&L Tuần' }, { href: '/dong-tien', icon: '$', label: 'Dòng tiền Tuần', badge: '8' }, { href: '/can-doi', icon: '⚖', label: 'Cân đối rút gọn' }, { href: '/du-toan', icon: '▤', label: 'Dự toán tuần tới' }] },
  { title: 'Kiểm soát thất thoát', items: [{ href: '/that-thoat-chi-tiet', icon: '◇', label: 'Thất thoát tồn kho', badge: '4' }] },
  { title: 'Hệ thống', items: [{ href: '/cai-dat-bot', icon: '⚙', label: 'Cài đặt & Bot báo cáo' }] }
];

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
  window.location.href = '/login';
}

async function sendBot() {
  const ok = window.confirm('Gửi báo cáo Telegram thật bằng tài khoản đang đăng nhập?');
  if (!ok) return;
  const response = await fetch('/api/telegram/send-test', { method: 'POST' }).catch(() => null);
  if (!response) {
    window.alert('Không kết nối được API Telegram.');
    return;
  }
  const payload = await response.json().catch(() => null);
  window.alert(payload?.message ?? (response.ok ? 'Đã gửi Bot.' : 'Không gửi Bot được.'));
}

export function OverviewPilotShell({ children, user }: { children: React.ReactNode; user: AuthUser }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] overflow-y-auto border-r border-slate-200 bg-white shadow-[8px_0_28px_rgba(15,23,42,0.05)] lg:block">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#b80012] text-lg font-black text-white">L</div>
            <div>
              <div className="text-xl font-black leading-5 text-slate-950">ERP Mini</div>
              <div className="mt-1 text-xs font-bold text-slate-500">Kế Toán Cơm Tấm Làng</div>
            </div>
          </div>
          <button className="mt-4 h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50" type="button">‹ Thu gọn menu</button>
        </div>
        <nav className="space-y-4 p-3">
          {navGroups.map((group) => (
            <section className="border-b border-slate-100 pb-3 last:border-b-0" key={group.title}>
              <p className="px-2 pb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#b80012]">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link className={active ? 'flex h-11 items-center gap-3 rounded-xl bg-red-50 px-3 text-sm font-black text-[#b80012] shadow-[inset_3px_0_0_#b80012]' : 'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-50'} href={item.href} key={item.href}>
                      <span className="w-5 text-center text-base">{item.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-red-100 px-1.5 text-[11px] font-black text-[#b80012]">{item.badge}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-red-900/20 bg-gradient-to-r from-[#8f0010] to-[#b80012] text-white shadow-[0_8px_24px_rgba(143,0,16,0.22)]">
          <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 lg:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Cơm Tấm Làng</p>
              <h1 className="truncate text-lg font-black leading-5 text-white">ERP Mini · Báo cáo kế toán</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black md:inline-flex">Tuần 25/2026</span>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700">V4.6</span>
              <button className="h-9 rounded-lg bg-white px-3 text-xs font-black text-[#b80012] shadow-sm" type="button" onClick={sendBot}>Gửi Bot</button>
              <span className="hidden rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold md:inline-flex">{user.displayName} · {user.role}</span>
              <button className="h-9 rounded-lg bg-white px-3 text-xs font-black text-[#b80012] shadow-sm" type="button" onClick={logout}>Đăng xuất</button>
            </div>
          </div>
        </header>

        <section className="sticky top-[62px] z-10 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-600">
              <span className="text-slate-900">Bộ lọc</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">0 bộ lọc</span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">2026-06-07 → 2026-06-23</span>
            </div>
            <button className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm" type="button">Mở bộ lọc</button>
          </div>
        </section>

        <main className="px-4 pb-28 pt-4 lg:px-6">{children}</main>
      </div>

      <div className="fixed bottom-4 left-[304px] right-6 z-30 hidden h-[72px] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 shadow-[0_18px_45px_rgba(15,23,42,0.16)] xl:flex">
        <div className="flex min-w-[250px] items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#b80012] text-white">▣</div>
          <div><p className="text-sm font-black text-slate-900">Tuần 25/2026</p><p className="text-xs font-bold text-slate-500">01/06 – 07/06/2026</p></div>
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">Cần đối chiếu</span>
        </div>
        <div className="flex flex-1 justify-end gap-3">
          <Link className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-xl bg-[#b80012] px-4 text-sm font-black text-white" href="/ban-lam-viec-ke-toan">Xem bàn làm việc</Link>
          <button className="h-11 min-w-[180px] rounded-xl border border-[#b80012] bg-white px-4 text-sm font-black text-[#b80012]" type="button">Đối chiếu dữ liệu</button>
          <button className="h-11 min-w-[160px] rounded-xl border border-[#b80012] bg-white px-4 text-sm font-black text-[#b80012]" type="button">Xuất báo cáo</button>
          <button className="h-11 min-w-[150px] rounded-xl bg-[#b80012] px-4 text-sm font-black text-white" type="button">Cảnh báo 3</button>
        </div>
      </div>
    </div>
  );
}
