# QA Report Before Vercel — Cơm Tấm Làng CEO Report Dashboard V4.3

## Tình hình chung

**Đạt để đưa lên staging/Vercel preview. Chưa gọi là production-live.**

Bản này đã được rà soát lại theo AGENTS.md cho nhóm UI/UX dashboard, data-entry/import, kế toán và deploy readiness. Mục tiêu chính là sửa lỗi UI/UX trước khi deploy: filter quá to, khoảng trắng nhiều, sidebar không cuộn, tab 9 bị mất, và thiếu bằng chứng QA.

## Đã đọc

- `AGENTS.md`
- `README.md`
- `package.json`
- `docs/02_UI_UX_BLUEPRINT.md`
- `docs/09_UAT_CHECKLIST.md`
- `docs/12_QA_REPORT_PRODUCTION_CODE.md`
- Các file layout/component/page liên quan trong `src/app` và `src/components`

Không tìm thấy thư mục `.agents/` trong package hiện tại.

## Mode

**Scoped Implementation + Debug/Fix + UI/UX QA.**

## File đã sửa

| File | Nội dung sửa |
|---|---|
| `src/components/layout/AppShell.tsx` | Giảm padding, bỏ giới hạn max-width cũ, nội dung tự giãn theo sidebar collapse |
| `src/components/layout/Sidebar.tsx` | Sidebar nhỏ hơn, nav cuộn nội bộ, tab 9 không bị mất, item gọn hơn |
| `src/components/layout/TopBar.tsx` | Topbar compact hơn, giảm chiều cao, role selector gọn |
| `src/components/layout/GlobalFilterBar.tsx` | Đổi filter thành 2 hàng compact, input height thấp, thêm filter chính/phụ rõ ràng |
| `src/components/layout/PageHeader.tsx` | Giảm padding/margin và chiều cao header |
| `src/components/ui/Card.tsx` | Card gọn hơn, giảm padding, giảm bo góc quá lớn |
| `src/components/ui/Button.tsx` | Button gọn hơn, thống nhất height |
| `src/components/ui/Badge.tsx` | Badge gọn hơn, tránh làm KPI card cao quá |
| `src/components/report/MetricCard.tsx` | KPI card compact, có badge cảnh báo, có line-clamp để không vỡ |
| `src/components/report/ChartCard.tsx` | Chart card gọn hơn, giảm khoảng trắng và chiều cao |
| `src/components/report/ReportTable.tsx` | Table dense hơn, có scroll nội bộ mặc định thấp hơn |
| `src/app/**/*.tsx` | Giảm `space-y`, `gap`, margin/padding thừa trên các tab |
| `scripts/static-ui-qa.mjs` | Nâng cấp QA rule: 9 tab, filter 2 hàng, sidebar scroll, KPI badges, batch upload, thất thoát, kế toán workflow |
| `package.json` | Update scripts lint, pin dependencies, nâng Next lên 16.2.9 để build không kẹt ở trace |
| `next.config.ts` | Update config Next 16, set `outputFileTracingRoot` |
| `eslint.config.mjs` | Thêm ESLint flat config compatible Next 16 |
| `vitest.config.ts` | Thêm alias `@` cho Vitest |
| `tsconfig.json` | Next build tự cập nhật JSX runtime và include `.next/dev/types` |
| `scripts/tao-google-sheet-mau.ts` | Xóa import unused |
| `src/lib/data-store/local-json-store.ts` | Sửa catch unused variable |
| `src/lib/google-sheets/schema.ts` | Xóa import unused |

## Vấn đề đã xử lý

### 1. Sidebar tab 9 bị mất

Đã sửa bằng cách:

- Sidebar `height: 100vh`.
- Sidebar `overflow-hidden` ở container ngoài.
- Nav menu `flex-1 min-h-0 overflow-y-auto`.
- Header/footer sidebar `shrink-0`.
- Width mở rộng giảm từ `w-72` xuống `w-64`.
- Width thu gọn giảm từ `88px` xuống `72px`.

Kết quả: tab 9 `Cài đặt & Bot báo cáo` vẫn nằm trong nav và sidebar có thể cuộn nội bộ.

### 2. Filter quá to

Đã đổi thành filter 2 hàng compact:

- Hàng 1: Chi nhánh, Kỳ báo cáo, Từ ngày, Đến ngày, Trạng thái dữ liệu.
- Hàng 2: Nguồn dữ liệu, Kênh bán, Nhóm chi phí, Cảnh báo, Người nhập, Làm mới.
- Input height giảm còn `h-8`.
- Label nhỏ, rõ.
- Filter không còn dùng layout 6 ô to như cũ.

### 3. Khoảng trắng nhiều

Đã giảm:

- Main content padding.
- Page header padding/margin.
- Card padding.
- KPI card padding/height.
- Chart card spacing.
- Table cell padding.
- Gap giữa section.

### 4. KPI cảnh báo

Đã giữ và chuẩn hóa:

- KPI có giá trị.
- Có trend tăng/giảm/vượt/hụt.
- Có badge Tốt/Cảnh báo/Nguy hiểm/Chờ dữ liệu.

### 5. Bàn làm việc kế toán

Đã giữ workflow:

- Checklist báo cáo thứ 2.
- Trạng thái báo cáo tuần.
- Batch upload nhiều file.
- Preview batch.
- Chốt báo cáo mock.
- Gửi CEO/Bot mock.
- Phân quyền mock.

### 6. Báo cáo thất thoát chi tiết

Đã giữ:

- Top 5 NVL thất thoát.
- Tỷ lệ thất thoát.
- Định mức.
- Vượt định mức.
- Trạng thái cảnh báo.

## QA đã chạy

| Command | Kết quả | Ghi chú |
|---|---|---|
| `npm install --no-audit --no-fund --progress=false` | Pass | Cài dependencies hoàn chỉnh |
| `npm run typecheck` | Pass | TypeScript OK |
| `npm run lint` | Pass | ESLint OK, không warning |
| `npm run test` | Pass | 1 test suite / 1 test pass |
| `npm run smoke` | Pass | Schema + import hash foundation OK |
| `npm run kiem-tra-schema` | Pass | 39 sheet tiếng Việt |
| `npm run static-ui-qa` | Pass | 9 tab, filter compact, sidebar scroll, KPI, batch upload, loss detail, kế toán workflow |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | Pass | Next.js 16.2.9 build thành công |
| `npm run start -- -p 3107` + curl smoke | Pass | 9 route chính + API health phản hồi |

## Route smoke test

| Route | HTTP |
|---|---:|
| `/` | 307 redirect |
| `/tong-quan` | 200 |
| `/pl-tuan` | 200 |
| `/dong-tien` | 200 |
| `/can-doi` | 200 |
| `/du-toan` | 200 |
| `/that-thoat-chi-tiet` | 200 |
| `/ban-lam-viec-ke-toan` | 200 |
| `/import-nhap-lieu` | 200 |
| `/cai-dat-bot` | 200 |
| `/api/health` | 200 |

## Desktop viewport QA

Đã kiểm tra bằng static UI rules cho các yêu cầu desktop chính:

- Sidebar có scroll nội bộ.
- Tab 9 tồn tại trong navigation.
- Filter chia 2 hàng compact.
- Filter dùng `h-8`.
- Content không còn dùng max-width cũ `max-w-[1440px]` gây rỗng ở màn lớn.
- Table có scroll nội bộ.
- KPI card có badge trạng thái.

Có thử dùng headless Chromium để chụp screenshot viewport nhưng môi trường container timeout ở Chromium do lỗi DBus/inotify/headless environment. Vì vậy phần screenshot tự động không được dùng làm bằng chứng pass. Bằng chứng pass chính là build + route smoke + static UI QA + code-level layout checks.

## Secret scan

Đã quét cơ bản. Không phát hiện secret thật trong source code. Có 2 false positive:

- `AGENTS.md` chứa ví dụ `BEGIN PRIVATE KEY` và `token=` trong phần hướng dẫn bảo mật.
- `package-lock.json` sinh trong môi trường test chứa internal registry URL, nên **không đóng gói `package-lock.json` vào file bàn giao**. `package.json` đã pin version để giảm drift.

## Rủi ro còn lại

- Chưa có đăng nhập thật.
- RBAC mới là mock UI, chưa phải server-side thật.
- Batch upload vẫn là mock, chưa parse Excel thật.
- Google Sheet write thật chưa bật.
- Telegram/Zalo chỉ mock, chưa gửi thật.
- Headless screenshot automation chưa ổn trong container; cần manual visual check trên máy thật hoặc Vercel Preview.
- Chưa UAT với kế toán thật nhập file thật.

## Kết luận deploy

**Can deploy to Vercel Preview/Staging: YES.**

**Can call production-live: NO.**

Điều kiện trước production-live:

1. Deploy Vercel Preview.
2. CEO review UI trên laptop thật.
3. Kế toán chạy thử workflow nhập liệu bằng file thật.
4. Bật parser Excel + Google Sheet write theo phase riêng.
5. Bật login/RBAC thật.
6. UAT 1–2 tuần trước khi dùng chính thức.
