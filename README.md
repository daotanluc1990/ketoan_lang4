# Cơm Tấm Làng — CEO Report Dashboard

> Current package: V4.7.1 Data Filter + Cashbook Intelligence — Vercel Preview/Staging Candidate. & Bàn làm việc kế toán

Web app nội bộ để kế toán nhập/import báo cáo thứ 2, hệ thống kiểm tra dữ liệu, tạo dashboard cho CEO và chuẩn bị báo cáo Telegram/Zalo.

## Trạng thái bản V4.7.1

Bản này giữ security gate của V4.6, bộ lọc thật của V4.7 và bổ sung **Cashbook Intelligence**: sổ quỹ được dùng để tính dòng tiền, phát hiện khoản chi lớn bất thường, bóc tách nhóm chi và sinh việc kế toán cần xử lý.

Đã có:

- Next.js + TypeScript + Tailwind.
- UI desktop-first có 9 tab:
  1. CEO Dashboard
  2. P&L Tuần
  3. Dòng tiền Tuần
  4. Cân đối rút gọn
  5. Dự toán tuần tới
  6. Báo cáo thất thoát chi tiết
  7. Bàn làm việc kế toán
  8. Nhập liệu & Import
  9. Cài đặt & Bot báo cáo
- Sidebar thu gọn/mở rộng và filter bar toàn cục.
- KPI có cảnh báo Tốt/Cảnh báo/Nguy hiểm.
- Import core foundation, audit foundation, Google Sheet schema foundation.
- Google Sheets service-account client.
- Multipart Excel batch preview/import foundation.
- Dashboard API đọc từ data store hiện tại.
- AI Agent hỗ trợ Gemini 2.5 Flash, có fallback rule-based khi thiếu env.
- Telegram send-test endpoint.
- Trang `/login` và session cookie httpOnly.
- RBAC server-side cho đúng 2 role: `CEO`, `Kế toán`.
- API import, conflicts, reports, AI, Telegram, Google Sheet health đã khóa quyền.
- Bộ lọc toàn cục đọc options từ dữ liệu thật qua `/api/reports/filter-options`.
- Report API hỗ trợ query params `fromDate`, `toDate`, `weekCode`, `branch`, `channel`, `costGroup`, `source`, `dataStatus`, `alertStatus`, `importedBy`.
- Báo cáo trả thêm `filterMetadata` để biết trước/sau lọc còn bao nhiêu dòng ở từng nguồn.

- Strict valid source row: chỉ tính dòng có `Mã lần import` bắt đầu bằng `IMP-` và `Trạng thái dữ liệu = Đã xác nhận`, tránh lấy nhầm dữ liệu mẫu.
- Dòng tiền dùng `DL_SO_QUY` để hiển thị tiền vào/ra, chi theo nhóm, top khoản chi lớn và task kế toán.
- Khoản trả NCC/capex/nhóm Khác từ sổ quỹ không được đưa thẳng vào P&L nếu chưa đối chiếu.

Chưa được gọi là production-live cho đến khi:

- Vercel Preview build/test pass.
- Google Sheet health thật pass.
- Import preview/confirm bằng file kế toán thật pass.
- Telegram gửi thật pass sau khi preview nội dung.
- CEO và Kế toán UAT ít nhất 1 tuần.

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở:

```text
http://localhost:3000
```

Trên Windows có thể bấm:

```text
start-local-windows.bat
```

## Kiểm tra

```bash
npm run typecheck
npm run lint
npm run build
npm run test
npm run smoke
npm run kiem-tra-schema
npm run static-ui-qa
```

Nếu máy chưa có internet hoặc chưa cài dependencies, cần chạy `npm install` trước. Không commit `node_modules`, `.next`, `.env.local`, hoặc secret.

## Required Vercel env for real mode

Xem `docs/14_VERCEL_ENV_AND_E2E_SETUP.md`.

Bắt buộc đặt trong Vercel Environment Variables, không nhập vào code hoặc Google Sheet:

- `DATA_STORE=google_sheets`
- `GOOGLE_SHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `AUTH_ENABLED=true`
- `AUTH_SESSION_SECRET`
- `AUTH_CEO_USERNAME`
- `AUTH_CEO_PASSWORD`
- `AUTH_ACCOUNTANT_USERNAME`
- `AUTH_ACCOUNTANT_PASSWORD`
- `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash` nếu bật AI thật
- `OPENAI_API_KEY`, `OPENAI_MODEL` chỉ dùng khi đổi `AI_PROVIDER=openai`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` nếu bật gửi Telegram thật

## Nguyên tắc dữ liệu

- Google Sheet dùng tên sheet và tên cột tiếng Việt.
- Code nội bộ có thể dùng không dấu/tiếng Anh để tránh lỗi kỹ thuật.
- Import bắt buộc preview trước khi ghi.
- Không ghi đè dữ liệu cũ tự động.
- Rollback bằng trạng thái lần import, không xóa raw data.
- Khi thiếu dữ liệu phải hiển thị: `Chưa đủ dữ liệu để kết luận.`

## Main E2E test endpoints

Sau khi đăng nhập:

- `GET /api/health`
- `GET /api/auth/me`
- `GET /api/google-sheets/health`
- `POST /api/import/preview`
- `POST /api/import/confirm`
- `GET /api/reports/dashboard`
- `GET|POST /api/ai/report-analysis`
- `GET|POST /api/telegram/send-test`

Chưa đăng nhập, các API nhạy cảm phải trả `401`.

## AI Skill/Agent rule

Nếu sau này tạo thêm AI Skill hoặc Agent Blueprint trong dự án, phải đọc `AGENTS.md` và `docs/SKILL_AGENT_STRUCTURE_GUIDE.md`, liệt kê files planned to change và chờ duyệt trước khi sửa.


## V4.8 — Cashflow + CEO Dashboard

- Kiểm tra source contract của 7 nguồn dữ liệu với schema 21 sheet.
- Dữ liệu giả dùng trong test chỉ nằm trong memory, không ghi Google Sheet thật và được reset sau mỗi test.
- CEO Dashboard có thêm bảng việc CEO cần nhìn ngay và độ đủ dữ liệu theo 7 nguồn.
- Dòng tiền Tuần có thêm so sánh tuần trước và lịch sử dòng tiền theo tuần.
- Sổ quỹ được dùng để phát hiện khoản chi lớn, trả NCC, capex và nhóm cần phân loại; không đưa thẳng các khoản này vào P&L nếu chưa có đối chiếu.

## V4.9 — Data Quality + Accounting Workbench Agent

- Thêm Data Quality Engine kiểm tra 21 sheet Data Master.
- Thêm Accounting Workbench Agent dạng rule-based, không dùng Gemini để quyết định đúng/sai dữ liệu.
- Bàn làm việc kế toán sinh task động từ nguồn thiếu, dòng chưa hợp lệ, lỗi import, trùng, lệch, sổ quỹ, trả NCC và capex.
- CEO Dashboard hiển thị Data Quality Summary và top việc kế toán cần xử lý.
- API mới:
  - `GET /api/data-quality`
  - `GET /api/accounting-workbench/tasks`
- V4.9 không ghi/xóa Google Sheet và chưa làm rollback thật.

## V5.0 — Finance Calculation Engine

- Thêm bộ máy tính P&L, cân đối rút gọn và thất thoát chi tiết từ dữ liệu nguồn đã lọc.
- Mỗi chỉ số tài chính có nguồn, số dòng, công thức, kỳ lọc, trạng thái và ghi chú kiểm chứng.
- Không dùng Gemini để tạo số tài chính; Gemini chỉ được giải thích sau khi code đã tính.
- P&L loại trừ trả NCC, capex và khoản chưa phân loại khỏi chi phí vận hành cho đến khi kế toán/CEO đối chiếu.
- Cân đối rút gọn đọc tiền từ sổ quỹ, tồn kho từ `DL_TON_KHO`, công nợ từ `DL_CONG_NO`, thu mua từ `DL_THU_MUA`.
- Thất thoát chi tiết chỉ đọc từ `DL_THAT_THOAT_NVL`; thiếu nguồn thì báo `Chưa đủ dữ liệu`.
- V5.0 không ghi/xóa Google Sheet và chưa làm Forecast Agent.
