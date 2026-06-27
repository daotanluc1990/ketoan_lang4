import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 60;

export default async function DuToanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildDashboardReport(await resolvePageSearchParams(searchParams));
  const canForecast = report.hasRealData && report.sourceCounts.cashbook > 0 && (report.sourceCounts.appRevenue > 0 || report.sourceCounts.storeRevenue > 0);
  const revenueNext = report.totals.revenue * 1.04;
  const cashOutNext = report.totals.cashOut || 0;
  const endingNext = report.totals.cashEnding + revenueNext - cashOutNext;
  const money = (value: number) => `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  const status = canForecast ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu';
  const revenueRows = canForecast ? [['Tổng doanh thu', report.executiveKpis[0]?.value ?? '—', money(revenueNext), '+4,0%', 'Tạm tính']] : [['Tổng doanh thu', '—', '—', '—', '—']];
  const costRows = canForecast ? [['Chi theo sổ quỹ', money(cashOutNext), money(cashOutNext), 'Cần xem xét', 'Theo tuần hiện tại']] : [['Chi theo sổ quỹ', '—', '—', '—', '—']];

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="Dự toán tuần tới"
        description="Dự toán tạm khi đã có doanh thu và sổ quỹ thật. Không dùng số dự toán để chốt kế toán."
        status={status}
        meta={['Tuần tiếp theo', 'Giả định tăng trưởng +4%', 'Cần đủ doanh thu + sổ quỹ']}
      />

      <ErpSectionFrame tone="kpi" title="Kịch bản dự toán chính">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ErpKpiCard label="Doanh thu dự kiến" value={canForecast ? money(revenueNext) : '—'} status={canForecast ? 'good' : 'neutral'} trend="Tạm tính +4%" icon="DT" />
          <ErpKpiCard label="Tổng chi dự kiến" value={canForecast ? money(cashOutNext) : '—'} status={cashOutNext ? 'warning' : 'neutral'} trend="Theo sổ quỹ" icon="CHI" />
          <ErpKpiCard label="Số dư dự kiến" value={canForecast ? money(endingNext) : '—'} status={endingNext < 0 ? 'danger' : canForecast ? 'good' : 'neutral'} trend="Cuối tuần" icon="CF" />
          <ErpKpiCard label="Mức tin cậy" value={canForecast ? 'Tạm' : 'Thấp'} status={canForecast ? 'warning' : 'neutral'} trend="Cần thêm lịch sử" icon="%" />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Điều kiện & mức tin cậy" contentClassName="p-0">
        <ErpStatusStrip
          items={[
            { label: 'Chi dự kiến', value: canForecast ? money(cashOutNext) : '—', tone: cashOutNext ? 'warning' : 'neutral', icon: 'OUT' },
            { label: 'Dòng tiền dự kiến', value: canForecast ? money(endingNext) : '—', tone: endingNext < 0 ? 'danger' : canForecast ? 'good' : 'neutral', icon: 'CF' },
            { label: 'Trạng thái', value: status, tone: canForecast ? 'warning' : 'neutral', icon: 'CHK' }
          ]}
        />
      </ErpSectionFrame>

      <ErpSectionFrame tone="table" title="Dự toán thu chi" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-2">
          <ErpDataTable
            title="Dự toán thu"
            headers={['Kênh', 'Tuần vừa rồi', 'Tuần tới', 'Tăng/giảm', 'Lý do']}
            rows={revenueRows}
            maxHeight="max-h-[260px]"
          />
          <ErpDataTable
            title="Dự toán chi"
            headers={['Nhóm chi', 'Tuần vừa rồi', 'Tuần tới', 'Duyệt?', 'Ghi chú']}
            rows={costRows}
            maxHeight="max-h-[260px]"
          />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Dòng tiền dự kiến" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ErpDataTable
            title="Dự toán dòng tiền"
            headers={['Chỉ số', 'Số tiền']}
            rows={[
              ['Dòng tiền hiện tại', canForecast ? report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—' : '—'],
              ['Tiền thu dự kiến', canForecast ? money(revenueNext) : '—'],
              ['Tổng chi dự kiến', canForecast ? money(cashOutNext) : '—'],
              ['Số dư dự kiến', canForecast ? money(endingNext) : '—']
            ]}
            maxHeight="max-h-[260px]"
          />
          <ErpInsightPanel
            title="Điều kiện dự toán"
            rows={[
              { label: 'Có doanh thu thật', value: report.totals.revenue ? 'Có' : 'Thiếu', caption: 'Cửa hàng hoặc app', tone: report.totals.revenue ? 'good' : 'warning' },
              { label: 'Có sổ quỹ thật', value: report.sourceCounts.cashbook ? 'Có' : 'Thiếu', caption: 'Dữ liệu tiền vào/ra', tone: report.sourceCounts.cashbook ? 'good' : 'warning' },
              { label: 'Giả định tăng trưởng', value: '+4%', caption: 'Tạm để lập kế hoạch, không phải số chốt', tone: 'warning' }
            ]}
          />
        </section>
      </ErpSectionFrame>
    </div>
  );
}
