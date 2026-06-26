import { BarChart3, Bot, BriefcaseBusiness, ClipboardList, DollarSign, FileInput, Home, Scale, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: 'Tổng quan' | 'Báo cáo quản trị' | 'Kế toán' | 'Hệ thống';
};

export const navigationItems: NavigationItem[] = [
  { href: '/tong-quan', label: 'Tổng quan kế toán', icon: Home, group: 'Tổng quan' },
  { href: '/pl-tuan', label: 'P&L Tuần', icon: BarChart3, group: 'Báo cáo quản trị' },
  { href: '/dong-tien', label: 'Dòng tiền Tuần', icon: DollarSign, group: 'Báo cáo quản trị' },
  { href: '/can-doi', label: 'Cân đối rút gọn', icon: Scale, group: 'Báo cáo quản trị' },
  { href: '/du-toan', label: 'Dự toán tuần tới', icon: ClipboardList, group: 'Báo cáo quản trị' },
  { href: '/that-thoat-chi-tiet', label: 'Báo cáo thất thoát chi tiết', icon: ShieldAlert, group: 'Báo cáo quản trị' },
  { href: '/ban-lam-viec-ke-toan', label: 'Bàn làm việc kế toán', icon: BriefcaseBusiness, group: 'Kế toán' },
  { href: '/import-nhap-lieu', label: 'Nhập liệu & Import', icon: FileInput, group: 'Kế toán' },
  { href: '/cai-dat-bot', label: 'Cài đặt & Bot báo cáo', icon: Bot, group: 'Hệ thống' }
];

export const navigationGroups = ['Tổng quan', 'Báo cáo quản trị', 'Kế toán', 'Hệ thống'] as const;
