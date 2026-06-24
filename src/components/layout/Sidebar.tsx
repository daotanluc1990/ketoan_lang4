'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationGroups, navigationItems } from './navigation';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={clsx('fixed inset-y-0 left-0 z-30 hidden h-screen flex-col overflow-hidden bg-lang-redDark text-white shadow-soft transition-[width] duration-200 lg:flex', collapsed ? 'w-[72px]' : 'w-64')}>
      <div className={clsx('shrink-0 border-b border-white/10 py-3', collapsed ? 'px-2' : 'px-4')}>
        <button type="button" onClick={onToggle} className={clsx('mb-3 inline-flex h-9 items-center gap-2 rounded-lg bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15', collapsed && 'w-full justify-center px-2')} aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed ? 'Thu gọn' : null}
        </button>
        <div className={clsx(collapsed && 'text-center')}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lang-yellow">CTL</p>
          {!collapsed ? <><h1 className="mt-1 text-base font-bold leading-tight">CEO Report</h1><p className="mt-1 text-xs text-white/65">CEO xem · Kế toán làm</p></> : <Menu className="mx-auto mt-2 h-5 w-5 text-white/70" />}
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sidebar-scroll" aria-label="Điều hướng chính">
        {navigationGroups.map((group) => (
          <div key={group} className="mb-3">
            {!collapsed ? <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">{group}</p> : null}
            <div className="space-y-1">
              {navigationItems.filter((item) => item.group === group).map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={clsx('flex items-center rounded-lg text-sm font-medium transition', collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5', active ? 'bg-lang-yellow text-lang-brown shadow' : 'text-white/78 hover:bg-white/10 hover:text-white')}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className={clsx('sidebar-foot shrink-0 border-t border-white/10 px-4 py-3 text-[11px] text-white/60', collapsed && 'hidden')}>V4.3 · QA/build fixed · Chưa kết nối dữ liệu thật</div>
    </aside>
  );
}
