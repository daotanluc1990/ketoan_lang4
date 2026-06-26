import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { PermissionMatrix } from '@/components/report/PermissionMatrix';
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
  const envChecklist = getEnvChecklist();
  const envRows = envChecklist.map((item) => [item.name, item.configured ? 'Đạt' : 'Chưa đủ dữ liệu', item.requiredFor]);
  const missingEnv = envChecklist.filter((item) => !item.configured).length;
  const status = hasGoogleSheetsEnv() ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu';
  const botPreviewRows = [
    ['Tình hình chung', report.hasRealData ? 'Có dữ liệu báo cáo để gửi bot' : 'Chưa đủ dữ liệu để kết luận'],
    ['Kết quả kinh doanh', report.executiveKpis.find((kpi) => kpi.label === 'Tổng doanh thu')?.value ?? '—'],
    ['Dòng tiền', report.sourceCounts.cashbook ? 'Đã có sổ quỹ' : 'Chưa có dữ liệu sổ quỹ'],
    ['CEO cần duyệt', report.missingSources.length ? `Cần bổ sung ${report.missingSources.join(', ')}` : 'Chờ kế toán kiểm tra cuối']
  ];

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="Cài đặt & Bot báo cáo"
        description="Kiểm tra môi trường, ngưỡng cảnh báo, mẫu nội dung bot và phân quyền trước khi gửi báo cáo CEO."
        status={status}
        meta={['Không in secret', 'Telegram Bot', 'AI Agent', 'RBAC']}
      />

      <ErpSectionFrame tone="kpi" title="Trạng thái cấu hình hệ thống">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ErpKpiCard label="Google Sheet" value={hasGoogleSheetsEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasGoogleSheetsEnv() ? 'good' : 'warning'} trend="Không in secret" icon="GS" />
          <ErpKpiCard label="AI Agent" value={hasAiEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasAiEnv() ? 'good' : 'warning'} trend="Gemini/OpenAI" icon="AI" />
          <ErpKpiCard label="Telegram" value={hasTelegramEnv() ? 'Đã cấu hình' : 'Thiếu env'} status={hasTelegramEnv() ? 'good' : 'warning'} trend="Gửi báo cáo" icon="BOT" />
          <ErpKpiCard label="RBAC" value="Session Auth" status="warning" trend="CEO/Kế toán" icon="RBAC" />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Checklist môi trường" contentClassName="p-0">
        <ErpStatusStrip
          items={[
            { label: 'Google Sheet', value: hasGoogleSheetsEnv() ? 'Đạt' : 'Thiếu', tone: hasGoogleSheetsEnv() ? 'good' : 'warning', icon: 'GS' },
            { label: 'AI Agent', value: hasAiEnv() ? 'Đạt' : 'Thiếu', tone: hasAiEnv() ? 'good' : 'warning', icon: 'AI' },
            { label: 'Telegram', value: hasTelegramEnv() ? 'Đạt' : 'Thiếu', tone: hasTelegramEnv() ? 'good' : 'warning', icon: 'BOT' },
            { label: 'Env còn thiếu', value: missingEnv, tone: missingEnv ? 'warning' : 'good', icon: 'ENV' },
            { label: 'Nguồn báo cáo', value: report.hasRealData ? 'Có dữ liệu' : 'Chờ dữ liệu', tone: report.hasRealData ? 'good' : 'warning', icon: 'DATA' },
            { label: 'Trạng thái', value: status, tone: hasGoogleSheetsEnv() ? 'warning' : 'neutral', icon: 'CHK' }
          ]}
        />
      </ErpSectionFrame>

      <ErpSectionFrame tone="table" title="Ngưỡng cảnh báo và biến môi trường" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-2">
          <ErpDataTable title="Ngưỡng cảnh báo KPI" headers={['Chỉ số', 'Tốt', 'Cảnh báo', 'Nguy hiểm']} rows={thresholdRows} maxHeight="max-h-[280px]" />
          <ErpDataTable title="Trạng thái biến môi trường" headers={['Biến', 'Trạng thái', 'Dùng cho']} rows={envRows} maxHeight="max-h-[280px]" />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="action" title="Cấu hình bot và mẫu nội dung" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <ErpDataTable title="Mẫu nội dung báo cáo bot" headers={['Phần', 'Nội dung']} rows={botPreviewRows} maxHeight="max-h-[280px]" />
          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="text-[15px] font-black tracking-[-0.02em] text-slate-950">Cấu hình bot</h3>
            <div className="mt-3 grid gap-3 text-xs font-semibold">
              <label className="grid gap-1"><span className="text-slate-700">Kênh gửi</span><select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option>Telegram trước</option><option>Zalo sau</option></select></label>
              <label className="grid gap-1"><span className="text-slate-700">Giờ gửi báo cáo tuần</span><input className="rounded-lg border border-slate-200 bg-white px-2 py-1.5" defaultValue="Thứ 2, 09:00" /></label>
              <label className="grid gap-1"><span className="text-slate-700">Gửi khi dữ liệu chưa đủ</span><select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option>Gửi cảnh báo thiếu dữ liệu</option><option>Không gửi</option></select></label>
              <div className="flex flex-wrap gap-2 pt-1"><Button>Gửi test</Button><Button variant="secondary">Lưu cấu hình</Button></div>
            </div>
          </section>
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="table" title="Kiểm tra trước khi gửi CEO" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <ErpInsightPanel
            title="Điểm cần kiểm trước khi gửi CEO"
            rows={[
              { label: 'Không in secret', value: 'Bắt buộc', caption: 'Chỉ hiện trạng thái env, không hiện giá trị', tone: 'good' },
              { label: 'Dữ liệu thiếu', value: report.missingSources.length, caption: report.missingSources.join(', ') || 'Không thiếu nguồn chính', tone: report.missingSources.length ? 'warning' : 'good' },
              { label: 'Telegram', value: hasTelegramEnv() ? 'Có thể gửi' : 'Thiếu env', caption: 'Kiểm tra bằng nút Gửi test', tone: hasTelegramEnv() ? 'good' : 'warning' },
              { label: 'Phân quyền', value: 'CEO/Kế toán', caption: 'Không mở dữ liệu cho role không phù hợp', tone: 'warning' }
            ]}
          />
          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="mb-3 text-[15px] font-black tracking-[-0.02em] text-slate-950">Phân quyền</h3>
            <PermissionMatrix />
          </section>
        </section>
      </ErpSectionFrame>
    </div>
  );
}
