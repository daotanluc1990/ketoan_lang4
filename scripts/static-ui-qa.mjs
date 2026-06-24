import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredRoutes = [
  'src/app/tong-quan/page.tsx',
  'src/app/pl-tuan/page.tsx',
  'src/app/dong-tien/page.tsx',
  'src/app/can-doi/page.tsx',
  'src/app/du-toan/page.tsx',
  'src/app/that-thoat-chi-tiet/page.tsx',
  'src/app/ban-lam-viec-ke-toan/page.tsx',
  'src/app/import-nhap-lieu/page.tsx',
  'src/app/cai-dat-bot/page.tsx'
];
const requiredFiles = [
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/GlobalFilterBar.tsx',
  'src/components/layout/TopBar.tsx',
  'src/components/forms/BatchUploadMock.tsx',
  'src/components/report/ReportStatusPanel.tsx',
  'src/components/report/PermissionMatrix.tsx',
  'src/components/report/MetricCard.tsx',
  'src/components/report/ReportTable.tsx'
];

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function assert(condition, message) { if (!condition) throw new Error(message); }

for (const file of [...requiredRoutes, ...requiredFiles]) assert(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);

const navigation = read('src/components/layout/navigation.ts');
const hrefCount = [...navigation.matchAll(/\{ href:/g)].length;
assert(hrefCount === 9, `Expected 9 navigation items, found ${hrefCount}`);
assert(navigation.includes('Bàn làm việc kế toán'), 'Navigation missing accountant workspace');
assert(navigation.includes('Báo cáo thất thoát chi tiết'), 'Navigation missing detailed loss report');
assert(navigation.includes('Cài đặt & Bot báo cáo'), 'Navigation missing tab 9');

const sidebar = read('src/components/layout/Sidebar.tsx');
assert(sidebar.includes('overflow-y-auto'), 'Sidebar nav must be internally scrollable');
assert(sidebar.includes('min-h-0'), 'Sidebar nav must allow flex child scrolling');
assert(sidebar.includes('h-screen'), 'Sidebar must be full viewport height');
assert(sidebar.includes('flex-1'), 'Sidebar nav must take remaining height');
assert(sidebar.includes('title={collapsed ? item.label : undefined}'), 'Collapsed sidebar should provide tooltip title');
assert(sidebar.includes("collapsed ? 'w-[72px]' : 'w-64'"), 'Sidebar width must be compact and collapsible');

const topbar = read('src/components/layout/TopBar.tsx');
assert(topbar.includes('Vai trò:'), 'Topbar missing role selector');
assert(topbar.includes('min-h-14'), 'Topbar should be compact');

const filters = read('src/components/layout/GlobalFilterBar.tsx');
for (const label of ['Chi nhánh', 'Kỳ báo cáo', 'Từ ngày', 'Đến ngày', 'Trạng thái dữ liệu', 'Nguồn dữ liệu', 'Kênh bán', 'Nhóm chi phí', 'Cảnh báo', 'Người nhập']) {
  assert(filters.includes(label), `Global filter missing ${label}`);
}
assert(filters.includes('h-8'), 'Filter inputs must be compact height h-8');
assert(filters.includes('md:grid-cols-5'), 'Filter row 1 should compact into 5 columns on desktop');
assert(filters.includes('md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]'), 'Filter row 2 should compact into 5 filters plus action on desktop');

const batch = read('src/components/forms/BatchUploadMock.tsx');
assert(batch.includes('multiple'), 'Batch upload input must support multiple files');
assert(batch.includes('Kiểm tra batch'), 'Batch upload missing dry-run check action');

const loss = read('src/app/that-thoat-chi-tiet/page.tsx');
for (const text of ['Top 5', 'Tỷ lệ thất thoát', 'Định mức', 'Vượt định mức']) assert(loss.includes(text), `Loss report missing ${text}`);

const workspace = read('src/app/ban-lam-viec-ke-toan/page.tsx');
for (const text of ['Checklist báo cáo thứ 2', 'Chốt báo cáo', 'Gửi CEO', 'PermissionMatrix']) assert(workspace.includes(text), `Accountant workspace missing ${text}`);

const metric = read('src/components/report/MetricCard.tsx');
assert(metric.includes('StatusBadge'), 'KPI cards must show status badge');
assert(metric.includes('line-clamp-2'), 'KPI cards must stay compact');

const reportTable = read('src/components/report/ReportTable.tsx');
assert(reportTable.includes("max-h-[360px]"), 'Tables must have compact internal scroll height');
assert(reportTable.includes('overflow-auto'), 'Tables must scroll internally');

const allUi = [...requiredRoutes, ...requiredFiles].map(read).join('\n');
assert(!allUi.includes('max-w-[1440px]'), 'Content should not be artificially narrow with old max width');
assert(!allUi.includes('lg:pl-72'), 'Old wide sidebar padding should be removed');
assert(!allUi.includes('rounded-2xl bg-white p-5'), 'Old large card spacing should be removed');

console.log('Static UI QA passed: 9 tabs, compact two-row filter, scrollable sidebar, KPI badges, batch upload, loss detail, accountant workflow, reduced spacing.');
