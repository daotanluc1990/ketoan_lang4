import { PageHeader } from '@/components/layout/PageHeader';
import { PermissionMatrix } from '@/components/report/PermissionMatrix';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getEnvChecklist, hasAiEnv, hasGoogleSheetsEnv, hasTelegramEnv } from '@/lib/env/server-env';
import { buildSnapshotOverviewReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

const thresholdRows = [
  ['COGS%', '<= 43%', '43–47%', '> 47%'],
  ['Labor%', '<= 18%', '18–22%', '> 22%'],
  ['Tiền app chưa về', '<= 20tr', '20–50tr', '> 50tr'],
  ['Thất thoát quy tiền', '<= 1tr', '1–3tr', '> 3tr'],
  ['Data Quality', '>= 90%', '70–89%', '< 70%']
];

export default async function CaiDatBotPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotOverviewReport(await resolvePageSearchParams(searchParams));
  const envRows = getEnvChecklist().map((item) => [item.name, item.configured ? 'Đạt' : 'Chưa đủ dữ liệu', item.requiredFor]);
  const botPreviewRows = [
    ['Tình hình chung', report.hasRealData ? 'Có dữ liệu báo cáo để gửi bot' : 'Chưa đủ dữ liệu để kết luận'],
    ['Kết quả kinh doanh', report.executiveKpis.find((kpi) => kpi.label === 'Tổng doanh thu')?.value ?? '—'],
    ['Dòng tiền', report.sourceCounts.cashbook ? 'Đã có sổ quỹ' : 'Chưa có dữ liệu sổ quỹ'],
    ['CEO cần duyệt', report.missingSources.length ? `Cần bổ sung ${report.missingSources.join(', ')}` : 'Chờ kế toán kiểm tra cuối']
  ];

  return (
    <div className="space-y-2.5">
      <PageHeader title="Cài đặt & Bot báo cáo" description="Ngưỡng cảnh báo, môi trường, bot và phân quyền." status={hasGoogleSheetsEnv() ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact label="Google Sheet" value={hasGoogleSheetsEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasGoogleSheetsEnv() ? 'good' : 'warning'} trend="Không in secret" />
        <MetricCard compact label="AI Agent" value={hasAiEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasAiEnv() ? 'good' : 'warning'} trend="Gemini/OpenAI" />
        <MetricCard compact label="Telegram" value={hasTelegramEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasTelegramEnv() ? 'good' : 'warning'} trend="Gửi báo cáo" />
        <MetricCard compact label="RBAC" value="Basic Auth" status="warning" trend="Cần nâng cấp sau" />
      </section>
      <section className="grid gap-2 xl:grid-cols-2">
        <Card><CardTitle>Ngưỡng cảnh báo KPI</CardTitle><div className="mt-2"><ReportTable headers={['Chỉ số', 'Tốt', 'Cảnh báo', 'Nguy hiểm']} rows={thresholdRows} maxHeight="max-h-[260px]" /></div></Card>
        <Card><CardTitle>Trạng thái biến môi trường</CardTitle><div className="mt-2"><ReportTable headers={['Biến', 'Trạng thái', 'Dùng cho']} rows={envRows} maxHeight="max-h-[260px]" /></div></Card>
      </section>
      <section className="grid gap-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card><CardTitle>Mẫu nội dung báo cáo bot</CardTitle><div className="mt-2"><ReportTable headers={['Phần', 'Nội dung']} rows={botPreviewRows} maxHeight="max-h-[260px]" /></div></Card>
        <Card><CardTitle>Cấu hình bot</CardTitle><div className="mt-2 grid gap-2 text-xs font-semibold"><label className="grid gap-1"><span className="text-slate-700">Kênh gửi</span><select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option>Telegram trước</option><option>Zalo sau</option></select></label><label className="grid gap-1"><span className="text-slate-700">Giờ gửi báo cáo tuần</span><input className="rounded-lg border border-slate-200 bg-white px-2 py-1.5" defaultValue="Thứ 2, 09:00" /></label><label className="grid gap-1"><span className="text-slate-700">Gửi khi dữ liệu chưa đủ</span><select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option>Gửi cảnh báo thiếu dữ liệu</option><option>Không gửi</option></select></label><div className="flex flex-wrap gap-2 pt-1"><Button>Gửi test</Button><Button variant="secondary">Lưu cấu hình</Button></div></div></Card>
      </section>
      <PermissionMatrix />
    </div>
  );
}
