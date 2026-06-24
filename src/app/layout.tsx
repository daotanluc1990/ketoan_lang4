import '@/styles/globals.css';
import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Cơm Tấm Làng — CEO Report Dashboard',
  description: 'Dashboard báo cáo CEO cho Cơm Tấm Làng'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
