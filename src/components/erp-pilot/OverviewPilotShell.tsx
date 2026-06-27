'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PilotFilterBar } from './PilotFilterBar';
import type { AuthUser } from '@/lib/auth/auth-types';

const PILOT_COLLAPSE_KEY = 'ctl-erp-pilot-sidebar-collapsed';

const navGroups = [
  { title: 'Tổng quan & xử lý', items: [{ href: '/tong-quan', icon: '⌂', label: 'Tổng quan kế toán' }, { href: '/ban-lam-viec-ke-toan', icon: '▣', label: 'Bàn làm việc kế toán' }, { href: '/import-nhap-lieu', icon: '⇩', label: 'Nhập liệu & Import' }] },
  { title: 'Báo cáo tài chính quản trị', items: [{ href: '/pl-tuan', icon: '▥', label: 'P&L Tuần' }, { href: '/dong-tien', icon: '$', label: 'Dòng tiền Tuần' }, { href: '/can-doi', icon: '⚖', label: 'Cân đối rút gọn' }, { href: '/du-toan', icon: '▤', label: 'Dự toán tuần tới' }] },
  { title: 'Kiểm soát thất thoát', items: [{ href: '/that-thoat-chi-tiet', icon: '◇', label: 'Thất thoát tồn kho' }] },
  { title: 'Hệ thống', items: [{ href: '/cai-dat-bot', icon: '⚙', label: 'Cài đặt & Bot báo cáo' }] }
];

const routeMeta: Record<string, { title: string; status: string; primaryHref: string; primaryLabel: string; dangerLabel: string }> = {
  '/tong-quan': { title: 'Tổng quan kế toán', status: 'Cần đối chiếu', primaryHref: '/ban-lam-viec-ke-toan', primaryLabel: 'Xem bàn làm việc', dangerLabel: 'Cảnh báo' },
  '/ban-lam-viec-ke-toan': { title: 'Bàn làm việc kế toán', status: 'Cần xử lý', primaryHref: '/import-nhap-lieu', primaryLabel: 'Nhập dữ liệu', dangerLabel: 'Task mở' },
  '/import-nhap-lieu': { title: 'Nhập liệu & Import', status: 'Preview trước', primaryHref: '/ban-lam-viec-ke-toan', primaryLabel: 'Xem checklist', dangerLabel: 'Lỗi import' },
  '/pl-tuan': { title: 'P&L Tuần', status: 'Tạm tính', primaryHref: '/ban-lam-viec-ke-toan', primaryLabel: 'Rà P&L', dangerLabel: 'Chưa chốt' },
  '/dong-tien': { title: 'Dòng tiền Tuần', status: 'Cần đối chiếu', primaryHref: '/ban-lam-viec-ke-toan', primaryLabel: 'Đối chiếu sổ quỹ', dangerLabel: 'Khoản cần rà' },
  '/can-doi': { title: 'Cân đối rút gọn', status: 'Cần đối chiếu', primaryHref: '/dong-tien', primaryLabel: 'Xem dòng tiền', dangerLabel: 'Nguồn thiếu' },
  '/du-toan': { title: 'Dự toán tuần tới', status: 'Dự kiến', primaryHref: '/dong-tien', primaryLabel: 'Kiểm dòng tiền', dangerLabel: 'Tạm tính' },
  '/that-thoat-chi-tiet': { title: 'Thất thoát tồn kho', status: 'Cảnh báo', primaryHref: '/ban-lam-viec-ke-toan', primaryLabel: 'Yêu cầu giải trình', dangerLabel: 'Cảnh báo' },
  '/cai-dat-bot': { title: 'Cài đặt & Bot báo cáo', status: 'Cấu hình', primaryHref: '/tong-quan', primaryLabel: 'Xem tổng quan', dangerLabel: 'Env cần rà' }
};

function readPilotCollapsed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PILOT_COLLAPSE_KEY) === 'true';
  } catch {
    return false;
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
  window.location.href = '/login';
}

async function sendBot() {
  const ok = window.confirm('Gửi tin nhắn test Telegram bằng tài khoản đang đăng nhập?');
  if (!ok) return;
  const response = await fetch('/api/telegram/send-test', { method: 'POST' }).catch(() => null);
  if (!response) {
    window.alert('Không kết nối được API Telegram.');
    return;
  }
  const payload = await response.json().catch(() => null);
  window.alert(payload?.message ?? (response.ok ? 'Đã gửi tin nhắn test.' : 'Không gửi được tin nhắn test.'));
}

export function OverviewPilotShell({ children, user }: { children: React.ReactNode; user: AuthUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(readPilotCollapsed);
  const meta = routeMeta[pathname] ?? routeMeta['/tong-quan'];
  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[248px]';
  const contentPadding = collapsed ? 'lg:pl-[72px]' : 'lg:pl-[248px]';
  const actionLeft = collapsed ? 'left-[92px]' : 'left-[268px]';

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(PILOT_COLLAPSE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const navItems = useMemo(() => navGroups, []);

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden overflow-y-auto border-r border-slate-200 bg-white shadow-[8px_0_28px_rgba(15,23,42,0.05)] transition-[width] duration-200 lg:block ${sidebarWidth}`}>
        <div className={collapsed ? 'border-b border-slate-200 p-2.5' : 'border-b border-slate-200 p-3'}>
          <div className={collapsed ? 'flex justify-center' : 'flex items-center gap-2'}>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#b80012] text-sm font-black text-white">L</div>
            {!collapsed ? (
              <div>
                <div className="text-base font-black leading-5 text-slate-950">ERP Mini</div>
                <div className="mt-0.5 text-[10px] font-bold text-slate-500">Kế Toán Cơm Tấm Làng</div>
              </div>
            ) : null}
          </div>
          <button className={collapsed ? 'mt-2.5 h-7 w-full rounded-lg border border-slate-200 bg-white text-[10px] font-black text-slate-600 shadow-sm hover:bg-slate-50' : 'mt-2.5 h-7 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-black text-slate-600 shadow-sm hover:bg-slate-50'} type="button" onClick={toggleCollapsed} aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}>
            {collapsed ? '›' : '‹ Thu gọn'}
          </button>
          {!collapsed ? (
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
              <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#b80012]">Đang xem</p>
              <p className="mt-0.5 truncate text-[11px] font-black text-slate-900">{meta.title}</p>
            </div>
          ) : null}
        </div>
        <nav className={collapsed ? 'space-y-2 p-1.5' : 'space-y-2.5 p-2'}>
          {navItems.map((group) => (
            <section className="border-b border-slate-100 pb-2 last:border-b-0" key={group.title}>
              {!collapsed ? <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#b80012]">{group.title}</p> : null}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link className={active ? (collapsed ? 'flex h-8 items-center justify-center rounded-lg bg-red-50 text-[12px] font-black text-[#b80012] shadow-[inset_3px_0_0_#b80012]' : 'flex h-8 items-center gap-2 rounded-lg bg-red-50 px-2 text-[12px] font-black text-[#b80012] shadow-[inset_3px_0_0_#b80012]') : (collapsed ? 'flex h-8 items-center justify-center rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50' : 'flex h-8 items-center gap-2 rounded-lg px-2 text-[12px] font-bold text-slate-600 hover:bg-slate-50')} href={item.href} key={item.href} title={collapsed ? item.label : undefined}>
                      <span className="w-4 text-center text-[13px]">{item.icon}</span>
                      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <div className={`transition-[padding] duration-200 ${contentPadding}`}>
        <header className="sticky top-0 z-20 border-b border-red-900/20 bg-gradient-to-r from-[#8f0010] to-[#b80012] text-white shadow-[0_8px_24px_rgba(143,0,16,0.22)]">
          <div className="flex min-h-[48px] items-center justify-between gap-2.5 px-3 lg:px-4">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/70">Cơm Tấm Làng</p>
              <h1 className="truncate text-[14px] font-black leading-4 text-white">{meta.title}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hidden rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-black md:inline-flex">Theo bộ lọc</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-700">V4.6</span>
              <button className="h-7 rounded-lg bg-white px-2 text-[10px] font-black text-[#b80012] shadow-sm" type="button" onClick={sendBot}>Gửi test Bot</button>
              <span className="hidden rounded-lg border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold md:inline-flex">{user.displayName} · {user.role}</span>
              <button className="h-7 rounded-lg bg-white px-2 text-[10px] font-black text-[#b80012] shadow-sm" type="button" onClick={logout}>Đăng xuất</button>
            </div>
          </div>
        </header>

        <PilotFilterBar status={meta.status} />

        <main className="px-2.5 pb-20 pt-2.5 lg:px-3.5">{children}</main>
      </div>

      <div className={`fixed bottom-2 right-4 z-30 hidden h-[52px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-[0_18px_45px_rgba(15,23,42,0.16)] transition-[left] duration-200 xl:flex ${actionLeft}`}>
        <div className="flex min-w-[200px] items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#b80012] text-xs text-white">▣</div>
          <div><p className="text-[12px] font-black text-slate-900">{meta.title}</p></div>
          <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700">{meta.status}</span>
        </div>
        <div className="flex flex-1 justify-end gap-2">
          <Link className="inline-flex h-8 min-w-[130px] items-center justify-center rounded-lg bg-[#b80012] px-2.5 text-[11px] font-black text-white" href={meta.primaryHref}>{meta.primaryLabel}</Link>
          <Link className="inline-flex h-8 min-w-[130px] items-center justify-center rounded-lg border border-[#b80012] bg-white px-2.5 text-[11px] font-black text-[#b80012]" href="/ban-lam-viec-ke-toan">Đối chiếu</Link>
          <button className="h-8 min-w-[110px] rounded-lg border border-[#b80012] bg-white px-2.5 text-[11px] font-black text-[#b80012]" type="button" onClick={() => window.print()}>Xuất báo cáo</button>
          <Link className="inline-flex h-8 min-w-[100px] items-center justify-center rounded-lg bg-[#b80012] px-2.5 text-[11px] font-black text-white" href="/that-thoat-chi-tiet">{meta.dangerLabel}</Link>
        </div>
      </div>
    </div>
  );
}
