import { MetricCard } from '@/components/report/MetricCard';

export function KpiCard({ label, value, hint, status = 'neutral' }: { label: string; value: string; hint: string; status?: 'good' | 'warning' | 'danger' | 'neutral' }) {
  return <MetricCard label={label} value={value} hint={hint} status={status} />;
}
