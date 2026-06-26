import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { buildSnapshotOverviewReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

const kpiCopy: Record<string, { hint: string; icon: string; order: number }> = {
  'Tổng doanh thu': { hint: 'Cửa hàng + App', icon: '₫', order: 1 },
  'Doanh thu app net': { hint: 'Kênh app', icon: 'APP', order: 2 },
  'Dòng tiền tạm': { hint: 'Thu - chi', icon: 'CF', order: 3 },
  'Chi cần phân loại': { hint: 'Kế toán rà', icon: '!', order: 4 },
  'Tồn kho': { hint: 'Theo tồn kho', icon: 'KHO', order: 5 },
  'Thất thoát quy tiền': { hint: 'Theo NVL', icon: 'TT', order: 6 }
};

function sourceTone(status: string) {
  return status === 'Đạt' ? 'good' as const : 'warning' as const;
}

export default async function TongQuanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotOverviewReport(await resolvePageSearchParams(searchParams));
  const status = report.hasRealData ? (report.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu';
  const mainKpis = report.executiveKpis
    .filter((kpi) => Object.keys(kpiCopy).includes(kpi.label))
    .sort((a, b) => kpiCopy[a.label].order - kpiCopy[b.label].order);
  const readySources = report.sourceReadinessRows.filter((row) => row[3] === 'Đạt').length;
  const missingSourceCount = report.missingSources.length;
  const openTaskCount = report.ceoActionRows.length;
  const issueCount = report.issueRows.length;
  const maxRevenue = Math.max(...report.revenueByChannel.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="Tổng quan kế toán"
        description="Rà nhanh dữ liệu, tiền, kho, thất thoát và việc cần xử lý."
        status={status}
        meta={['Theo bộ lọc', 'Nguồn: Google Sheet', `Cache: snapshot ${report.hasRealData ? 'đang dùng' : 'chờ dữ liệu'}`]}
      />

      {missingSourceCount ? (
        <ErpSectionFrame tone="risk" title="Nguồn dữ liệu cần bổ sung">
          <p className="text-[12px] font-bold text-amber-900">Còn {missingSourceCount} nguồn cần bổ sung: <span className="font-black">{report.missingSources.join(', ')}</span>.</p>
        </ErpSectionFrame>
      ) : null}

      <ErpSectionFrame tone="kpi" title="Chỉ số chính" description="6 chỉ số CEO cần nhìn trước khi xuống bảng chi tiết.">
        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {mainKpis.map((kpi) => (
            <ErpKpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              hint={kpiCopy[kpi.label]?.hint ?? kpi.hint}
              trend={kpi.trend}
              status={kpi.status ?? 'neutral'}
              icon={kpiCopy[kpi.label]?.icon}
            />
          ))}
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Sức khỏe dữ liệu & cảnh báo" contentClassName="p-0">
        <ErpStatusStrip
          items={[
            { label: 'Tất cả vấn đề', value: openTaskCount + issueCount + missingSourceCount, tone: openTaskCount + issueCount + missingSourceCount ? 'warning' : 'good', icon: 'ALL' },
            { label: 'Cần xử lý', value: openTaskCount, tone: openTaskCount ? 'warning' : 'good', icon: 'TASK' },
            { label: 'Vấn đề trước khi chốt', value: issueCount, tone: issueCount ? 'warning' : 'good', icon: 'CHK' },
            { label: 'Nguồn còn thiếu', value: missingSourceCount, tone: missingSourceCount ? 'danger' : 'good', icon: 'DATA' },
            { label: 'Nguồn đã đạt', value: readySources, tone: readySources ? 'good' : 'neutral', icon: 'OK' },
            { label: 'Thất thoát cần rà', value: report.lossTop5Rows.length, tone: report.lossTop5Rows.length ? 'warning' : 'neutral', icon: 'TT' }
          ]}
        />
      </ErpSectionFrame>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <ErpSectionFrame tone="neutral" title="Doanh thu theo nguồn" description="Nếu doanh thu bằng 0đ, cần import/đối chiếu nguồn.">
          <div className="space-y-3">
            {report.revenueByChannel.map((item, index) => (
              <div key={item.channel}>
                <div className="mb-1 flex items-center justify-between gap-3 text-[12px] font-black text-slate-700">
                  <span>{item.channel}</span>
                  <span className="number text-slate-500">{item.revenue}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={index === 0 ? 'h-full rounded-full bg-red-700' : 'h-full rounded-full bg-slate-300'} style={{ width: `${Math.max(6, Math.round((item.value / maxRevenue) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ErpSectionFrame>

        <ErpDataTable
          title="Việc kế toán cần xử lý"
          count={openTaskCount}
          headers={['Ưu tiên', 'Vấn đề', 'Ảnh hưởng', 'Hành động', 'Owner']}
          rows={report.ceoActionRows}
          maxHeight="max-h-[300px]"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ErpDataTable
          title="Chi theo đơn vị chịu chi"
          headers={['Đơn vị', 'Bản chất chi', 'Số tiền', 'Xử lý kế toán', 'Tỷ trọng', 'Trạng thái', 'Hành động']}
          rows={report.cashbookGroupRows}
          maxHeight="max-h-[360px]"
        />
        <div className="space-y-4">
          <ErpInsightPanel
            title="Top vấn đề trước khi chốt"
            actionLabel="Chi tiết →"
            rows={report.issueRows.slice(0, 5).map((row) => ({ label: row[1] ?? 'Vấn đề cần rà', value: row[2] ?? row[0], caption: row[3] ?? row[4], tone: 'warning' }))}
          />
          <ErpInsightPanel
            title="Độ sẵn sàng nguồn dữ liệu"
            actionLabel={`${readySources}/${report.sourceReadinessRows.length}`}
            rows={report.sourceReadinessRows.slice(0, 7).map((row) => ({ label: row[0], value: row[2], caption: `${row[1]} · ${row[4]}`, tone: sourceTone(row[3]) }))}
          />
        </div>
      </section>

      <ErpSectionFrame tone="risk" title="Kiểm soát thất thoát & nguồn chính" contentClassName="p-3">
        <section className="grid gap-4 xl:grid-cols-2">
          <ErpDataTable
            title="Thất thoát NVL — cần giải trình"
            headers={['NVL', 'ĐVT', 'Chênh SL', 'Giá trị lệch', 'Tỷ lệ', 'Trạng thái', 'Hành động']}
            rows={report.lossTop5Rows.map((row) => [row[0], row[1], row[2], row[3], row[4], row[7], row[8]])}
            maxHeight="max-h-[300px]"
          />
          <ErpDataTable
            title="Ma trận nguồn chính"
            headers={['Sheet', 'Vai trò', 'Dòng', 'Trạng thái', 'Ảnh hưởng']}
            rows={report.sourceReadinessRows}
            maxHeight="max-h-[300px]"
          />
        </section>
      </ErpSectionFrame>
    </div>
  );
}
