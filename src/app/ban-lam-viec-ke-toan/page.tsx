import { ErpDataTable } from '@/components/erp/ErpDataTable';
import { ErpInsightPanel } from '@/components/erp/ErpInsightPanel';
import { ErpKpiCard } from '@/components/erp/ErpKpiCard';
import { ErpPageHeader } from '@/components/erp/ErpPageHeader';
import { ErpSectionFrame } from '@/components/erp/ErpSectionFrame';
import { ErpStatusStrip } from '@/components/erp/ErpStatusStrip';
import { AccountingCostCenterPanel } from '@/components/report/AccountingCostCenterPanel';
import { PermissionMatrix } from '@/components/report/PermissionMatrix';
import { RefreshReportCacheButton } from '@/components/report/RefreshReportCacheButton';
import { buildSnapshotWorkbenchReport } from '@/lib/reports/cached-fast-page-reports';
import { resolvePageSearchParams, type PageSearchParams } from '@/lib/reports/page-search-params';

export const revalidate = 300;

function toneFromStatus(status: string) {
  return status === 'Tốt' || status === 'Đạt' ? 'good' as const : status === 'Nguy hiểm' || status === 'Có lỗi' ? 'danger' as const : 'warning' as const;
}

export default async function BanLamViecKeToanPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const report = await buildSnapshotWorkbenchReport(await resolvePageSearchParams(searchParams));
  const checklistRows = report.dataQualitySourceRows;
  const taskRows = report.accountingWorkbenchTaskRows.length ? report.accountingWorkbenchTaskRows : [['Tốt', 'Không có việc mở', 'Nguồn chính', 'Không có cảnh báo lớn', 'Kế toán', 'Theo dõi', 'Không', 'Rà lần cuối']];
  const openWarnings = taskRows.filter((row) => row[0] !== 'Tốt').length;
  const missingSources = report.dataQuality.missingRequiredSources.length;
  const dataStatus = report.dataQuality.status;

  return (
    <div className="space-y-4">
      <ErpPageHeader
        eyebrow="Cơm Tấm Làng · ERP Mini"
        title="Bàn làm việc kế toán"
        description="Trung tâm kiểm tra nguồn dữ liệu, task mở, cache báo cáo và việc cần xử lý trước khi gửi CEO."
        status={dataStatus}
        meta={['Data Quality', 'Task kế toán', 'Làm mới snapshot cache']}
      />

      <ErpSectionFrame tone="kpi" title="Trạng thái vận hành" description="Nhìn nhanh chất lượng dữ liệu, nguồn thiếu, task mở và cache báo cáo.">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ErpKpiCard label="Data Quality" value={`${report.dataQuality.score}/100`} status={dataStatus === 'Tốt' ? 'good' : 'warning'} trend={report.dataQuality.message} icon="DQ" />
          <ErpKpiCard label="Nguồn còn thiếu" value={`${missingSources}`} status={missingSources ? 'warning' : 'good'} trend={missingSources ? report.dataQuality.missingRequiredSources.join(', ') : 'Đủ nguồn'} icon="DATA" />
          <ErpKpiCard label="Task mở" value={`${taskRows.length}`} status={openWarnings ? 'warning' : 'good'} trend="Việc cần xử lý" icon="TASK" />
          <ErpKpiCard label="Cache" value="Snapshot" status="good" trend="Đọc nhanh" icon="⚡" />
        </section>
      </ErpSectionFrame>

      <ErpSectionFrame tone="summary" title="Tóm tắt trước khi chốt" contentClassName="p-0">
        <ErpStatusStrip
          items={[
            { label: 'Data Quality', value: `${report.dataQuality.score}/100`, tone: dataStatus === 'Tốt' ? 'good' : 'warning', icon: 'DQ' },
            { label: 'Nguồn thiếu', value: missingSources, tone: missingSources ? 'warning' : 'good', icon: 'DATA' },
            { label: 'Task mở', value: taskRows.length, tone: openWarnings ? 'warning' : 'good', icon: 'TASK' },
            { label: 'Cảnh báo task', value: openWarnings, tone: openWarnings ? 'warning' : 'good', icon: '!' },
            { label: 'Cache báo cáo', value: 'Snapshot', tone: 'good', icon: 'CACHE' },
            { label: 'Trạng thái', value: dataStatus, tone: toneFromStatus(dataStatus), icon: 'OK' }
          ]}
        />
      </ErpSectionFrame>

      <ErpSectionFrame
        tone="action"
        title="Hành động nhanh"
        description="Dùng khi vừa import dữ liệu hoặc cần làm mới snapshot báo cáo."
        action={<RefreshReportCacheButton />}
      >
        <p className="text-[12px] font-semibold text-slate-600">Sau khi làm mới, kiểm tra lại Data Quality và các task mở trước khi gửi CEO.</p>
      </ErpSectionFrame>

      <ErpSectionFrame tone="table" title="Khu vực xử lý chính" description="Checklist nguồn dữ liệu và việc kế toán cần xử lý." contentClassName="p-0">
        <section className="grid gap-4 p-3 xl:grid-cols-2">
          <ErpDataTable
            title="Checklist nguồn dữ liệu"
            headers={['Sheet', 'Nguồn', 'Dòng hợp lệ', 'Trạng thái', 'Ảnh hưởng', 'Hành động']}
            rows={checklistRows}
            maxHeight="max-h-[360px]"
          />
          <ErpDataTable
            title="Việc cần xử lý"
            count={taskRows.length}
            headers={['Mức độ', 'Việc cần làm', 'Nguồn', 'Bằng chứng', 'Owner', 'Deadline', 'Duyệt', 'Hành động']}
            rows={taskRows}
            maxHeight="max-h-[360px]"
          />
        </section>
      </ErpSectionFrame>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ErpSectionFrame tone="table" title="Chi theo đơn vị chịu chi" contentClassName="p-3">
          <AccountingCostCenterPanel rows={report.cashbookGroupRows} />
        </ErpSectionFrame>
        <ErpInsightPanel
          title="Ma trận nguồn chính"
          actionLabel={`${checklistRows.length} nguồn`}
          rows={report.dataQualityMatrixRows.slice(0, 8).map((row) => ({ label: row[0], value: row[2], caption: `${row[1]} · ${row[4]}`, tone: toneFromStatus(row[3]) }))}
        />
      </section>

      <ErpSectionFrame tone="neutral" title="Phân quyền vận hành">
        <PermissionMatrix />
      </ErpSectionFrame>
    </div>
  );
}
