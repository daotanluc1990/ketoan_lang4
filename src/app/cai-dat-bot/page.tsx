import { PageHeader } from '@/components/layout/PageHeader';
import { PermissionMatrix } from '@/components/report/PermissionMatrix';
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
    ['Kết quả kinh doanh', report.hasRealData ? 'Sử dụng số thật từ Google Sheet/data store' : 'Chưa đủ dữ liệu để kết luận'],
    ['Dòng tiền', report.sourceCounts.cashbook ? 'Đã có sổ quỹ' : 'Chưa có dữ liệu sổ quỹ'],
    ['Dự toán tuần tới', report.hasRealData ? 'Dự toán tạm theo dữ liệu thật' : 'Chưa đủ dữ liệu để dự toán'],
    ['CEO cần duyệt', report.missingSources.length ? `Cần bổ sung ${report.missingSources.join(', ')}` : 'Chờ kế toán kiểm tra cuối']
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Cài đặt & Bot báo cáo" description="Ngưỡng cảnh báo, mapping dữ liệu, phân quyền, Telegram/Zalo và mẫu nội dung bot theo dữ liệu thật." status={hasGoogleSheetsEnv() ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Google Sheet" value={hasGoogleSheetsEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasGoogleSheetsEnv() ? 'good' : 'warning'} trend="Không in secret" />
        <MetricCard label="AI Agent" value={hasAiEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasAiEnv() ? 'good' : 'warning'} trend="Gemini/OpenAI" />
        <MetricCard label="Telegram" value={hasTelegramEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasTelegramEnv() ? 'good' : 'warning'} trend="Gửi báo cáo" />
        <MetricCard label="RBAC" value="Basic Auth" status="warning" trend="Cần nâng cấp sau" />
      </section>
      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Ngưỡng cảnh báo KPI</CardTitle>
          <div className="mt-3"><ReportTable headers={['Chỉ số', 'Tốt', 'Cảnh báo', 'Nguy hiểm']} rows={thresholdRows} /></div>
        </Card>
        <Card>
          <CardTitle>Trạng thái biến môi trường</CardTitle>
          <div className="mt-3"><ReportTable headers={['Biến', 'Trạng thái', 'Dùng cho']} rows={envRows} /></div>
        </Card>
      </section>
      <Card>
        <CardTitle>Mẫu nội dung báo cáo bot</CardTitle>
        <div className="mt-3"><ReportTable headers={['Phần', 'Nội dung']} rows={botPreviewRows} /></div>
      </Card>
      <Card>
        <CardTitle>Cấu hình bot</CardTitle>
        <div className="mt-3 grid gap-3 text-sm">
          <label className="grid gap-1"><span className="font-semibold text-lang-brown">Kênh gửi</span><select className="rounded-xl border border-black/10 bg-white px-3 py-2"><option>Telegram trước</option><option>Zalo sau</option></select></label>
          <label className="grid gap-1"><span className="font-semibold text-lang-brown">Giờ gửi báo cáo tuần</span><input className="rounded-xl border border-black/10 bg-white px-3 py-2" defaultValue="Thứ 2, 09:00" /></label>
          <label className="grid gap-1"><span className="font-semibold text-lang-brown">Gửi khi dữ liệu chưa đủ</span><select className="rounded-xl border border-black/10 bg-white px-3 py-2"><option>Gửi cảnh báo thiếu dữ liệu</option><option>Không gửi</option></select></label>
          <div className="flex flex-wrap gap-3 pt-2"><Button>Gửi test</Button><Button variant="secondary">Lưu cấu hình</Button></div>
        </div>
      </Card>
      <PermissionMatrix />
    </div>
  );
}
