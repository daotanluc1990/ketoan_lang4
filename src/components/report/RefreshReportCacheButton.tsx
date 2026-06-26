'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function RefreshReportCacheButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function refresh() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/reports/prewarm', { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setMessage(payload?.message ?? 'Không làm mới được cache.');
        return;
      }
      setMessage(`Đã làm mới cache: ${payload.refreshed?.length ?? 0} báo cáo.`);
    } catch {
      setMessage('Không làm mới được cache.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={refresh} disabled={loading}>{loading ? 'Đang làm mới...' : 'Làm mới báo cáo'}</Button>
      {message ? <span className="text-xs font-bold text-slate-600">{message}</span> : null}
    </div>
  );
}
