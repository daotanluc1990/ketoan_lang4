import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getEnvChecklist, hasAiEnv, hasGoogleSheetsEnv, hasTelegramEnv } from '@/lib/env/server-env';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const dynamic = 'force-dynamic';

const thresholdRows = [
  ['COGS%', '<= 43%', '43–47%', '> 47%'],
  ['Labor%', '<= 18%', '18–22%', '> 22%'],
  ['Tiền app chưa về', '<= 20tr', '20–50tr', '> 50tr'],
  ['Thất thoát quy tiền', '<= 1tr', '1–3tr', '> 3tr'],
  ['Data Quality', '>= 90%', '70–89%', '< 70%']
];

export default async function CaiDatBotPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const envRows = getEnvChecklist().map((item) => [item.name, item.configured ? 'Đạt' : 'Chưa đủ dữ liệu', item.requiredFor]);
  const botPreviewRows = [
    ['Tình hình chung', report.message],
    ['Kinh doanh', report.hasRealData ? 'Dùng số thật từ Data Master' : 'Chưa đủ dữ liệu'],
    ['Dòng tiền', report.sourceCounts.cashbook ? 'Đã có sổ quỹ' : 'Chưa có sổ quỹ'],
    ['CEO cần duyệt', report.missingSources.length ? `Bổ sung ${report.missingSources.length} nguồn` : 'Chờ kế toán kiểm tra']
  ];
  return (
    <div className="space-y-2.5">
      <PageHeader title="Cài đặt & Bot báo cáo" description="Ngưỡng cảnh báo, môi trường, bot và mẫu nội dung gửi CEO." status={hasGoogleSheetsEnv() ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Google Sheet" value={hasGoogleSheetsEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasGoogleSheetsEnv() ? 'good' : 'warning'} trend="Data Master" compact />
        <MetricCard label="AI Agent" value={hasAiEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasAiEnv() ? 'good' : 'warning'} trend="Không tự bịa số" compact />
        <MetricCard label="Telegram" value={hasTelegramEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasTelegramEnv() ? 'good' : 'warning'} trend="Gửi báo cáo" compact />
        <MetricCard label="RBAC" value="Basic Auth" status="warning" trend="Nâng cấp sau" compact />
      </section>
      <section className="grid gap-2.5 xl:grid-cols-2">
        <Card>
          <CardTitle>Ngưỡng cảnh báo KPI</CardTitle>
          <div className="mt-2"><ReportTable headers={['Chỉ số', 'Tốt', 'Cảnh báo', 'Nguy hiểm']} rows={thresholdRows} maxHeight="max-h-[260px]" /></div>
        </Card>
        <Card>
          <CardTitle>Trạng thái biến môi trường</CardTitle>
          <div className="mt-2"><ReportTable headers={['Biến', 'Trạng thái', 'Dùng cho']} rows={envRows} maxHeight="max-h-[260px]" /></div>
        </Card>
      </section>
      <section className="grid gap-2.5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>Mẫu nội dung bot</CardTitle>
          <div className="mt-2"><ReportTable headers={['Phần', 'Nội dung']} rows={botPreviewRows} maxHeight="max-h-[260px]" /></div>
        </Card>
        <Card>
          <CardTitle>Cấu hình bot</CardTitle>
          <div className="mt-2 grid gap-2 text-xs md:text-sm">
            <label className="grid gap-1"><span className="font-semibold text-lang-brown">Kênh gửi</span><select className="h-8 rounded-lg border border-black/10 bg-white px-2"><option>Telegram trước</option><option>Zalo sau</option></select></label>
            <label className="grid gap-1"><span className="font-semibold text-lang-brown">Giờ gửi báo cáo tuần</span><input className="h-8 rounded-lg border border-black/10 bg-white px-2" defaultValue="Thứ 2, 09:00" /></label>
            <div className="flex flex-wrap gap-2 pt-1"><Button>Gửi test</Button><Button variant="secondary">Lưu cấu hình</Button></div>
          </div>
        </Card>
      </section>
    </div>
  );
}
