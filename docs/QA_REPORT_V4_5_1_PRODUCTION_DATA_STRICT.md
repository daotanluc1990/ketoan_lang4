# QA REPORT — V4.5.1 Production Data Strict

## 1. Mục tiêu

Sửa app từ trạng thái có thể hiển thị dữ liệu mẫu/mock sang trạng thái production data strict:

- Google Sheet trống thì web phải báo `Chưa đủ dữ liệu để kết luận`.
- Không fallback sang dữ liệu mẫu trong production page/API.
- Import preview chỉ kiểm tra, không ghi Google Sheet.
- Import confirm mới ghi Google Sheet.
- Dashboard/P&L/Dòng tiền/Cân đối/Thất thoát chỉ hiển thị số khi có dữ liệu import thật.

## 2. Agent mode

Theo `AGENTS.md`, task được xử lý theo Mode C — Scoped Implementation sau khi người dùng duyệt rõ: `Duyệt V4.5.1 Production Data Strict`.

Các nguyên tắc đã áp dụng:

- Không đọc/in secret trong `.env`.
- Không đóng gói `.env` vào file bàn giao.
- Không deploy Vercel trực tiếp.
- Không gọi production-live nếu chưa có đủ QA/build và smoke test Vercel.
- Google Sheet write/clear là hành động nguy hiểm; chỉ thực hiện khi được duyệt và phải báo rõ kết quả.

## 3. Kiểm tra Google Sheet thật

Google Sheet người dùng cung cấp đã truy cập được bằng Google Drive connector.

Kết quả đọc sheet:

- File tồn tại, native Google Sheets.
- Tên file hiện tại: `CEO_REPORT_DATA_MASTER_COM_TAM_LANG_V5_AUTO_IMPORT`.
- Các sheet Data Master chính tồn tại: `DL_DOANH_THU_APP`, `DL_DOANH_THU_CUA_HANG`, `DL_SO_QUY`, `DL_TON_KHO`, `DL_THAT_THOAT_NVL`, `IMPORT_LICH_SU`, `AUDIT_LOG`.
- Header thật nằm ở dòng 3, không phải dòng 1.
- `DL_SO_QUY`, `DL_TON_KHO`, `DL_THAT_THOAT_NVL`, `IMPORT_LICH_SU` hiện chưa có dữ liệu import thật từ dòng 4 trở xuống.
- `DL_DOANH_THU_APP` còn sót dữ liệu mẫu cũ từ template ở dòng 4 trở xuống.

Kết luận: Google Sheet đã liên kết được ở mức đọc/kiểm tra bằng connector, nhưng chưa có dữ liệu import thật để app tính báo cáo. Code V4.5.1 đã được sửa để bỏ qua dòng mẫu cũ và chỉ tính các dòng có dấu hiệu import thật: `Mã dòng dữ liệu`, `Mã lần import`, hoặc `Tên file nguồn`.

## 4. Các thay đổi chính

### 4.1. Google Sheet V5 schema

Đã đồng bộ schema với Google Sheet V5:

- Header dòng 3 được tự phát hiện.
- Đọc dữ liệu sau dòng header, không đọc nhầm dòng tiêu đề hoặc dòng mô tả.
- Các cột được đổi đúng theo sheet V5:
  - `Số tiền` thay cho `Giá trị` ở sổ quỹ.
  - `Tồn kho` / `Giá trị tồn` thay cho tên cột cũ.
  - `MoMo/chuyển khoản` thay cho `MoMo`.
  - `AUDIT_LOG` dùng cột `ID`, `Thời gian`, `Người dùng`, `Vai trò`, `Hành động`, `Đối tượng`, `Trước`, `Sau`, `Ghi chú`, `IP/Thiết bị`.

### 4.2. Tắt mock/fallback trên production report

Đã sửa `report-aggregator`:

- Không import `executiveKpis`, `pnlRows`, `lossTop5Rows`, `issueRows` từ file mock.
- Không fallback mock khi Google Sheet trống.
- Nếu không có dữ liệu thật, API/page trả trạng thái `hasRealData=false` và message `Chưa đủ dữ liệu để kết luận`.

### 4.3. Sửa page production

Các page đã chuyển sang đọc từ `buildDashboardReport()` thay vì mock:

- `tong-quan`
- `pl-tuan`
- `dong-tien`
- `can-doi`
- `du-toan`
- `that-thoat-chi-tiet`
- `ban-lam-viec-ke-toan`
- `import-nhap-lieu`
- `cai-dat-bot`

### 4.4. Sửa Import UI thật

`BatchUploadMock.tsx` được giữ tên để không phá static QA cũ, nhưng nội dung đã đổi thành real workflow:

- `Kiểm tra batch` gọi `POST /api/import/preview`.
- `Import file đạt` gọi `POST /api/import/confirm`.
- Confirm bị chặn nếu có `Lỗi > 0`, `Lệch > 0`, hoặc file không nhận diện.
- `Tải file lỗi` tải JSON lỗi/lệch từ preview.
- `Hủy batch` chỉ xóa UI state, không thay đổi Google Sheet.

### 4.5. Sửa API báo cáo

Đã bổ sung/sửa các API:

- `/api/reports/pl-tuan`
- `/api/reports/dong-tien`
- `/api/reports/can-doi`
- `/api/reports/that-thoat-chi-tiet`
- `/api/reports/import-status`

Các API trả metadata:

- `dataMode`
- `hasRealData`
- `message`
- `sourceCounts`
- `missingSources`

### 4.6. AI/Bot strict data

- AI Agent không được kết luận khi thiếu dữ liệu thật.
- Telegram/Bot message lấy từ dữ liệu thật hoặc báo thiếu dữ liệu.
- Không còn hard-code số mẫu trong `cai-dat-bot` và `AiAgentPanel`.

## 5. QA đã chạy trong container

### 5.1. Static UI QA

Command:

```bash
node scripts/static-ui-qa.mjs
```

Kết quả:

```text
Static UI QA passed: 9 tabs, compact two-row filter, scrollable sidebar, KPI badges, batch upload, loss detail, accountant workflow, reduced spacing.
```

### 5.2. Production mock grep

Kiểm tra production path không import mock:

```bash
grep -R "@/lib/mock/ceo-report-data" -n src/app src/components src/lib
```

Kết quả: không có production import từ mock. Chỉ còn file fixture legacy `src/lib/mock/ceo-report-data.ts`, không còn được production pages dùng.

### 5.3. Real import endpoint grep

Xác nhận UI gọi API thật:

```bash
grep -R "/api/import/preview\|/api/import/confirm" -n src/components/forms src/app/api
```

Kết quả: `BatchUploadMock.tsx` gọi đúng `/api/import/preview` và `/api/import/confirm`.

### 5.4. Typecheck/build

`npm install` trong container không hoàn tất do timeout/cache dependency, nên các lệnh phụ thuộc `node_modules` không thể chạy đầy đủ trong môi trường này.

Các lần thử:

- `npm install`: timeout.
- `npm install --no-audit --no-fund --ignore-scripts --prefer-offline`: timeout.
- `npm install --offline`: fail do thiếu cache package `estree-walker`.
- `npm run typecheck`: fail chủ yếu do thiếu dependencies/types (`next`, `react`, `@types/node`, `xlsx`, `zod`, `vitest`, `tailwindcss`).

Các lỗi TypeScript logic không phụ thuộc dependency được phát hiện trong quá trình lọc đã được sửa:

- Import rollback không ghi vào sheet thiếu trên live Google Sheet.
- Telegram stripHtml xử lý field optional.
- Một số implicit any trong import UI/layout.
- MetricCard không truyền `key` như prop trong môi trường thiếu React types.

Kết luận: QA tĩnh pass; full typecheck/lint/test/build phải chạy lại trên máy/Vercel sau khi install dependencies thành công.

## 6. Google Sheet cleanup

Đã cố gắng clear dòng dữ liệu mẫu cũ trong `DL_DOANH_THU_APP` bằng Google Sheets batch update, nhưng tool write bị chặn bởi cơ chế an toàn. Không có thao tác xóa dữ liệu nào được thực hiện trên Google Sheet.

Code V4.5.1 đã có lớp lọc để bỏ qua các dòng không phải dữ liệu import thật, nên dòng mẫu cũ sẽ không được tính báo cáo sau khi deploy bản mới.

Khuyến nghị sau khi deploy bản mới: xóa thủ công dòng 4 trở xuống trong các sheet `DL_*` nếu muốn Data Master sạch tuyệt đối.

## 7. Vercel smoke test cần chạy sau khi deploy

Sau khi deploy lại Vercel với bản V4.5.1, test theo thứ tự:

1. `/api/health`
2. `/api/google-sheets/health`
3. `/api/reports/dashboard`
4. `/api/reports/pl-tuan`
5. `/api/reports/import-status`
6. Mở `/pl-tuan` khi Google Sheet chưa có dữ liệu import thật → phải báo `Chưa đủ dữ liệu để kết luận`.
7. Import 1 file `SoQuy` → bấm `Kiểm tra batch` → chỉ preview, Google Sheet chưa ghi.
8. Nếu preview không lỗi/lệch → bấm `Import file đạt`.
9. Mở `DL_SO_QUY` → phải có dữ liệu từ dòng 4 trở xuống.
10. Mở `/api/reports/import-status` → `sourceCounts.cashbook > 0`.
11. Import đủ 5 file → P&L mới hiện số thật.

## 8. Kết luận QA

- Static UI QA: PASS.
- Google Sheet link/read: PASS.
- Production mock imports: PASS.
- Import UI API wiring: PASS.
- Live Google Sheet cleanup: NOT DONE — tool write blocked.
- Full npm install/typecheck/lint/test/build: NOT VERIFIED trong container do dependency install timeout.

Trạng thái bàn giao: **Ready for Vercel Preview redeploy, not production-live yet**.

Production-live chỉ được gọi sau khi Vercel redeploy pass và các endpoint Google Sheet/import/report pass trên môi trường thật.
