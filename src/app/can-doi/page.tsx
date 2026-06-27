import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { buildSnapshotBalanceReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

export default async function CanDoiPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotBalanceReport(await resolvePageSearchParams(searchParams));
  const hasBalanceData = report.sourceCounts.cashbook > 0 || report.sourceCounts.inventory > 0 || report.sourceCounts.lossRows > 0;
  const status = hasBalanceData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu';
  const cashKpi = report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—';
  const inventoryKpi = report.executiveKpis.find((kpi) => kpi.label === 'Tồn kho')?.value ?? '—';
  const lossKpi = report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—';
  const warningRows = [
    ['Tồn âm', `${report.totals.negativeStockCount} mặt hàng`, 'Rà nhập/xuất/kiểm kê'],
    ['Trạng thái', hasBalanceData ? 'Có dữ liệu' : 'Chưa đủ', 'Đối chiếu trước khi gửi']
  ];

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="Cân đối rút gọn"
        description="Đọc nhanh tiền, tồn kho, thất thoát và nguồn còn thiếu. Đây là cân đối quản trị tạm, chưa phải báo cáo tài chính pháp lý."
        status={status}
        meta={['Tiền', 'Tồn kho', 'Thất thoát', 'Nguồn còn thiếu']}
      />

      <ErpSectionFrame tone="kpi" title="Chỉ số cân đối chính">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ErpKpiCard label="Dòng tiền tạm" value={cashKpi} status={report.totals.cashEnding < 0 ? 'danger' : hasBalanceData ? 'good' : 'neutral'} trend="Từ sổ quỹ" icon="CF" />
          <ErpKpiCard label="Tồn kho" value={inventoryKpi} status={report.totals.negativeStockCount ? 'warning' : hasBalanceData ? 'good' : 'neutral'} trend={`${report.totals.negativeStockCount} tồn âm`} icon="KHO" />
          <ErpKpiCard label="Thất thoát" value={lossKpi} status={report.totals.lossValue ? 'warning' : 'neutral'} trend="Theo NVL" icon="TT" />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Tóm tắt rủi ro" contentClassName="p-0">
        <ErpStatusStrip
          items={[
            { label: 'Thất thoát', value: report.sourceCounts.lossRows, tone: report.sourceCounts.lossRows ? 'warning' : 'neutral', icon: 'TT' },
            { label: 'Tồn âm', value: report.totals.negativeStockCount, tone: report.totals.negativeStockCount ? 'warning' : 'good', icon: 'AM' },
            { label: 'Trạng thái', value: status, tone: hasBalanceData ? 'warning' : 'neutral', icon: 'CHK' }
          ]}
        />
      </ErpSectionFrame>

      <ErpSectionFrame tone="table" title="Bảng cân đối và cảnh báo" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ErpDataTable
            title="Bảng cân đối rút gọn"
            headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Trạng thái', 'Ghi chú']}
            rows={report.balanceRows}
            maxHeight="max-h-[430px]"
          />
          <div className="space-y-4">
            <ErpInsightPanel
              title="Cảnh báo cần xem"
              rows={warningRows.map((row) => ({ label: row[0], value: row[1], caption: row[2], tone: row[0] === 'Tồn âm' && report.totals.negativeStockCount ? 'warning' : 'neutral' }))}
            />
            <ErpInsightPanel
              title="Đọc nhanh cân đối"
              rows={[
                { label: 'Tiền', value: cashKpi, caption: 'Từ sổ quỹ hiện có', tone: report.totals.cashEnding < 0 ? 'danger' : 'good' },
                { label: 'Hàng tồn', value: inventoryKpi, caption: 'Có thể chưa đủ nếu thiếu kiểm kê', tone: report.totals.negativeStockCount ? 'warning' : 'good' },
                { label: 'Thất thoát', value: lossKpi, caption: 'Cần tách khỏi hao hụt/hủy', tone: report.totals.lossValue ? 'warning' : 'neutral' }
              ]}
            />
          </div>
        </section>
      </ErpSectionFrame>
    </div>
  );
}
