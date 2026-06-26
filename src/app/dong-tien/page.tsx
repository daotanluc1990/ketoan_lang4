import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { buildSnapshotCashflowReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

function valueOf(kpis: Array<{ label: string; value: string }>, label: string) {
  return kpis.find((kpi) => kpi.label === label)?.value ?? '—';
}

export default async function DongTienPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotCashflowReport(await resolvePageSearchParams(searchParams));
  const hasCashbook = report.sourceCounts.cashbook > 0;
  const moneyIn = valueOf(report.executiveKpis, 'Tiền vào');
  const moneyOut = valueOf(report.executiveKpis, 'Tiền ra');
  const cashEnding = valueOf(report.executiveKpis, 'Dòng tiền tạm');
  const unclassified = valueOf(report.executiveKpis, 'Chi cần phân loại');
  const status = hasCashbook ? (report.totals.cashUnclassifiedOut ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu';

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="Dòng tiền Tuần"
        description="Tiền vào, tiền ra, chi chi nhánh/BTT và các khoản cần rà trước khi gửi CEO."
        status={status}
        meta={['Tuần/Kỳ theo bộ lọc', 'Nguồn chính: Sổ quỹ', 'Không đổi logic dòng tiền']}
      />

      {!hasCashbook ? (
        <ErpSectionFrame tone="risk" title="Thiếu dữ liệu sổ quỹ">
          <p className="text-[12px] font-bold text-amber-900">Cần import sổ quỹ trước khi đọc dòng tiền tuần.</p>
        </ErpSectionFrame>
      ) : null}

      <ErpSectionFrame tone="kpi" title="Dòng tiền chính" description="Đọc nhanh tiền vào, tiền ra, dòng tiền tạm và khoản cần phân loại.">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ErpKpiCard label="Tiền vào" value={moneyIn} status={hasCashbook ? 'good' : 'neutral'} trend="Đã ghi nhận thu" icon="IN" />
          <ErpKpiCard label="Tiền ra" value={moneyOut} status={hasCashbook ? 'warning' : 'neutral'} trend="Đã ghi nhận chi" icon="OUT" />
          <ErpKpiCard label="Dòng tiền tạm" value={cashEnding} status={report.totals.cashEnding < 0 ? 'danger' : hasCashbook ? 'good' : 'neutral'} trend="Thu - chi" icon="CF" />
          <ErpKpiCard label="Chi cần phân loại" value={unclassified} status={report.totals.cashUnclassifiedOut ? 'warning' : hasCashbook ? 'good' : 'neutral'} trend="Kế toán rà" icon="CHK" />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Tóm tắt đối chiếu dòng tiền" contentClassName="p-0">
        <ErpStatusStrip
          items={[
            { label: 'Sổ quỹ', value: report.sourceCounts.cashbook, tone: hasCashbook ? 'good' : 'danger', icon: 'SQ' },
            { label: 'Tiền vào', value: moneyIn, tone: hasCashbook ? 'good' : 'neutral', icon: 'IN' },
            { label: 'Tiền ra', value: moneyOut, tone: hasCashbook ? 'warning' : 'neutral', icon: 'OUT' },
            { label: 'Chi chưa phân loại', value: unclassified, tone: report.totals.cashUnclassifiedOut ? 'warning' : 'good', icon: 'CHK' },
            { label: 'Khoản chi lớn', value: report.cashbookLargeExpenseRows.length, tone: report.cashbookLargeExpenseRows.length ? 'warning' : 'good', icon: 'BIG' },
            { label: 'Trạng thái', value: status, tone: status === 'Tốt' ? 'good' : 'warning', icon: 'OK' }
          ]}
        />
      </ErpSectionFrame>

      <ErpSectionFrame tone="table" title="Bảng dòng tiền & phân loại chi" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-2">
          <ErpDataTable
            title="Bảng dòng tiền tuần"
            headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Đối chiếu', 'Ghi chú']}
            rows={report.cashflowRows}
            maxHeight="max-h-[360px]"
          />
          <ErpDataTable
            title="Chi theo đơn vị chịu chi & bản chất kế toán"
            headers={['Đơn vị chịu chi', 'Bản chất chi', 'Số tiền', 'Xử lý kế toán', 'Tỷ trọng', 'Trạng thái', 'Hành động']}
            rows={report.cashbookGroupRows}
            maxHeight="max-h-[360px]"
          />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="risk" title="Khoản cần ưu tiên rà" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ErpDataTable
            title="Khoản chi lớn / cần đối chiếu"
            headers={['Ngày', 'Mã tuần', 'Đơn vị chịu chi', 'Bản chất chi', 'Xử lý kế toán', 'Diễn giải', 'Số tiền', 'Trạng thái', 'Hành động']}
            rows={report.cashbookLargeExpenseRows}
            maxHeight="max-h-[360px]"
          />
          <ErpInsightPanel
            title="Tín hiệu dòng tiền"
            rows={[
              { label: 'Sổ quỹ hợp lệ', value: report.sourceCounts.cashbook, caption: hasCashbook ? 'Có thể đọc' : 'Cần import', tone: hasCashbook ? 'good' : 'danger' },
              { label: 'Dòng tiền tạm', value: cashEnding, caption: 'Số tạm theo dữ liệu hiện có', tone: report.totals.cashEnding < 0 ? 'danger' : 'good' },
              { label: 'Chi cần phân loại', value: unclassified, caption: 'Cần xử lý trước khi chốt', tone: report.totals.cashUnclassifiedOut ? 'warning' : 'good' },
              { label: 'Khoản chi lớn', value: report.cashbookLargeExpenseRows.length, caption: 'Ưu tiên rà chứng từ', tone: report.cashbookLargeExpenseRows.length ? 'warning' : 'neutral' }
            ]}
          />
        </section>
      </ErpSectionFrame>
    </div>
  );
}
