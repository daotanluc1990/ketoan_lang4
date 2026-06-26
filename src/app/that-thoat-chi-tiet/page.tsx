import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { buildSnapshotLossReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

function parseMoneyText(text: string) {
  return Number(text.replace(',', '.').replace('tr', '').replace(' tỷ', '')) || 0;
}

export default async function ThatThoatChiTietPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotLossReport(await resolvePageSearchParams(searchParams));
  const hasLoss = report.sourceCounts.lossRows > 0;
  const lossValue = report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—';
  const topLoss = report.lossTop5Rows[0];
  const status = hasLoss ? 'Cảnh báo' : 'Chưa đủ dữ liệu';
  const totalLossRankingValue = report.lossTop5Rows.reduce((sum, row) => sum + parseMoneyText(row[3] ?? '0'), 0);

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="Thất thoát tồn kho"
        description="Tách cảnh báo hao hụt chế biến và thất thoát tồn kho. BTT sang cửa hàng không được tự động xem là hàng hủy."
        status={status}
        meta={['Tuần/Kỳ theo bộ lọc', 'Nguồn: báo cáo thất thoát NVL', 'Không đổi quy tắc tính thất thoát']}
      />

      {!hasLoss ? (
        <ErpSectionFrame tone="risk" title="Thiếu dữ liệu thất thoát">
          <p className="text-[12px] font-bold text-amber-900">Cần import báo cáo thất thoát hoặc dữ liệu NVL đã chuẩn hóa trước khi kết luận.</p>
        </ErpSectionFrame>
      ) : null}

      <ErpSectionFrame tone="kpi" title="Chỉ số thất thoát chính">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ErpKpiCard label="Thất thoát quy tiền" value={lossValue} status={report.totals.lossValue ? 'warning' : 'neutral'} trend="Tổng giá trị lệch" icon="TT" />
          <ErpKpiCard label="NVL theo dõi" value={`${report.sourceCounts.lossRows}`} status={hasLoss ? 'good' : 'neutral'} trend="Đã có dữ liệu" icon="NVL" />
          <ErpKpiCard label="Top cảnh báo" value={topLoss?.[0] ?? '—'} status={report.lossTop5Rows.length ? 'warning' : 'neutral'} trend={topLoss?.[3] ?? 'Chưa có'} icon="TOP" />
          <ErpKpiCard label="Quy ước lệch" value="Âm = thiếu" status="warning" trend="Dương = dư" icon="SL" />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Risk band thất thoát" contentClassName="p-0">
        <ErpStatusStrip
          items={[
            { label: 'Dòng dữ liệu', value: report.sourceCounts.lossRows, tone: hasLoss ? 'good' : 'danger', icon: 'DATA' },
            { label: 'Top cần xử lý', value: report.lossTop5Rows.length, tone: report.lossTop5Rows.length ? 'warning' : 'neutral', icon: 'TOP' },
            { label: 'Giá trị top', value: `${totalLossRankingValue.toFixed(1)}tr`, tone: totalLossRankingValue ? 'warning' : 'neutral', icon: 'VND' },
            { label: 'Thiếu/dư', value: 'Tách riêng', tone: 'warning', icon: 'SL' },
            { label: 'BTT sang CH', value: 'Không tự hủy', tone: 'good', icon: 'BTT' },
            { label: 'Trạng thái', value: status, tone: hasLoss ? 'warning' : 'neutral', icon: 'CHK' }
          ]}
        />
      </ErpSectionFrame>

      <ErpSectionFrame tone="risk" title="Top nguyên liệu cần xử lý" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ErpDataTable
            title="Top nguyên liệu cần xử lý"
            headers={['NVL', 'ĐVT', 'Chênh SL', 'Giá trị', 'Tỷ lệ', 'Trạng thái', 'Hành động']}
            rows={report.lossTop5Rows.map((row) => [row[0], row[1], row[2], row[3], row[4], row[7], row[8]])}
            maxHeight="max-h-[360px]"
          />
          <div className="space-y-4">
            <ErpInsightPanel
              title="Top theo giá trị lệch"
              rows={report.lossTop5Rows.slice(0, 5).map((row, index) => ({ label: `${index + 1}. ${row[0]}`, value: row[3], caption: `${row[1]} · lệch ${row[2]} · tỷ lệ ${row[4]}`, tone: index === 0 ? 'danger' : 'warning' }))}
            />
            <ErpInsightPanel
              title="Quy ước đọc nhanh"
              rows={[
                { label: 'Âm = thiếu kho', value: 'Cần giải trình', caption: 'Có thể do tiêu hao, nhập thiếu, bán/hủy chưa ghi đủ', tone: 'warning' },
                { label: 'Dương = dư kho', value: 'Cần rà', caption: 'Có thể do xuất bán lý thuyết sai hoặc kiểm kê lệch', tone: 'neutral' },
                { label: 'BTT sang cửa hàng', value: 'Không tự hủy', caption: 'Phải đối chiếu phiếu trước khi kết luận thất thoát', tone: 'good' }
              ]}
            />
          </div>
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="table" title="Tách hao hụt và thất thoát" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-2">
          <ErpDataTable
            title="Hao hụt / vượt định mức chế biến"
            headers={['Món/NVL', 'Định mức', 'Thực tế', 'Vượt SL', 'Tỷ lệ', 'Hành động']}
            rows={report.lossTop5Rows.map((row) => [row[0], row[5] ?? 'Định mức', row[2], row[2], row[4], 'Rà thao tác/định lượng'])}
            maxHeight="max-h-[300px]"
          />
          <ErpDataTable
            title="Thất thoát tồn kho"
            headers={['NVL', 'Tồn lệch', 'Giá trị', 'Tỷ lệ', 'Nguyên nhân', 'Hành động']}
            rows={report.lossTop5Rows.map((row) => [row[0], row[2], row[3], row[4], row[6] ?? 'Cần kiểm', row[8]])}
            maxHeight="max-h-[300px]"
          />
        </section>
      </ErpSectionFrame>
    </div>
  );
}
