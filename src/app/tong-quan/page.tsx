import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { buildSnapshotOverviewReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

const kpiCopy: Record<string, { hint: string; icon: string }> = {
  'Tổng doanh thu': { hint: 'Cửa hàng + App', icon: '₫' },
  'Doanh thu cửa hàng': { hint: 'Offline + MoMo', icon: 'CH' },
  'Doanh thu app net': { hint: 'Kênh app', icon: 'APP' },
  'Tiền vào': { hint: 'Đã ghi nhận thu', icon: 'IN' },
  'Tiền ra': { hint: 'Đã ghi nhận chi', icon: 'OUT' },
  'Dòng tiền tạm': { hint: 'Thu - chi', icon: 'CF' },
  'Chi cần phân loại': { hint: 'Kế toán rà', icon: '!' },
  'Tồn kho': { hint: 'Theo tồn kho', icon: 'KHO' },
  'Thất thoát quy tiền': { hint: 'Theo NVL', icon: 'TT' }
};

function sourceTone(status: string) {
  return status === 'Đạt' ? 'good' as const : 'warning' as const;
}

export default async function TongQuanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotOverviewReport(await resolvePageSearchParams(searchParams));
  const status = report.hasRealData ? (report.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu';
  const mainKpis = report.executiveKpis.filter((kpi) => Object.keys(kpiCopy).includes(kpi.label));
  const readySources = report.sourceReadinessRows.filter((row) => row[3] === 'Đạt').length;
  const missingSourceCount = report.missingSources.length;
  const openTaskCount = report.ceoActionRows.length;
  const issueCount = report.issueRows.length;
  const maxRevenue = Math.max(...report.revenueByChannel.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      <ErpPageHeader
        title="Tổng quan kế toán"
        description="Rà nhanh dữ liệu, tiền, kho, thất thoát và việc cần xử lý. Đây là màn pilot UI, chỉ đổi cách trình bày dữ liệu hiện có."
        status={status}
        meta={['Tuần/Kỳ theo bộ lọc', 'Nguồn: Google Sheet', `Cache: snapshot ${report.hasRealData ? 'đang dùng' : 'chờ dữ liệu'}`]}
      />

      {missingSourceCount ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-900">
          Còn {missingSourceCount} nguồn cần bổ sung: <span className="font-black">{report.missingSources.join(', ')}</span>.
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black tracking-[-0.02em] text-slate-950">Doanh thu theo nguồn</h3>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">Nếu doanh thu bằng 0đ, cần import/đối chiếu nguồn.</p>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase text-slate-500">BAR</span>
          </div>
          <div className="mt-4 space-y-4">
            {report.revenueByChannel.map((item, index) => (
              <div key={item.channel}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px] font-black text-slate-700">
                  <span>{item.channel}</span>
                  <span className="number text-slate-500">{item.revenue}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={index === 0 ? 'h-full rounded-full bg-red-700' : 'h-full rounded-full bg-slate-300'} style={{ width: `${Math.max(6, Math.round((item.value / maxRevenue) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <ErpDataTable
          title="Việc kế toán cần xử lý"
          count={openTaskCount}
          headers={['Ưu tiên', 'Vấn đề', 'Ảnh hưởng', 'Hành động', 'Owner']}
          rows={report.ceoActionRows}
          maxHeight="max-h-[300px]"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
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
    </div>
  );
}
