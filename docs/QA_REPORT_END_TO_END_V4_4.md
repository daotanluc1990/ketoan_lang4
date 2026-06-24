# QA REPORT END-TO-END V4.4

## Tình hình chung

Đạt để deploy Vercel Preview/Staging. Chưa gọi production-live vì môi trường hiện tại không có secret thật để xác nhận Google Sheet/OpenAI/Telegram pass với tài khoản thật.

## Đã đọc

- `AGENTS.md`
- `README.md`
- `docs/03_GOOGLE_SHEETS_CONTRACT.md`
- `docs/04_IMPORT_CONTRACT.md`
- `docs/07_AI_AGENT_CONTRACT.md`
- `docs/08_TELEGRAM_ZALO_CONTRACT.md`
- `package.json`
- Source API/import/layout hiện tại

## Đã sửa / thêm

### Google Sheet thật

- `src/lib/env/server-env.ts`
- `src/lib/google-sheets/sheets-client.ts`
- `src/app/api/google-sheets/health/route.ts`
- `src/app/api/reports/dashboard/route.ts`
- `src/app/api/reports/tong-quan/route.ts`

Chức năng:

- Đọc/ghi Google Sheets bằng service account khi đủ env.
- Không tự sửa header.
- Không tạo sheet.
- Append row theo header hiện có.
- Health check không in secret.

### Import Excel thật

- `src/lib/import/parsers/excel-utils.ts`
- `src/lib/import/parsers/import-parser-types.ts`
- `src/lib/import/parsers/excel-parsers.ts`
- `src/lib/import/parsers/excel-batch.ts`
- `src/app/api/import/preview/route.ts`
- `src/app/api/import/confirm/route.ts`

Chức năng:

- Upload nhiều file cùng lúc bằng multipart form-data.
- Nhận diện 5 nhóm file thật: app, cửa hàng, sổ quỹ, tồn kho, thất thoát NVL.
- Preview dòng mới/trùng/lệch/lỗi.
- Confirm mới ghi.
- Có batch import và audit log.

### AI Agent OpenAI API

- `src/lib/ai/agent.ts`
- `src/app/api/ai/report-analysis/route.ts`
- `src/app/api/ai-agent/analyze/route.ts`

Chức năng:

- Nếu có `OPENAI_API_KEY`: gọi OpenAI API thật.
- Nếu thiếu key: fallback rule-based và ghi rõ chưa gọi AI thật.
- Prompt bắt buộc không bịa số, thiếu dữ liệu thì trả `Chưa đủ dữ liệu để kết luận.`

### Telegram thật

- `src/lib/telegram/telegram-client.ts`
- `src/app/api/telegram/send-test/route.ts`
- `src/app/api/bot/telegram/send-test/route.ts`
- `src/app/api/bot/zalo/send-test/route.ts`

Chức năng:

- `GET /api/telegram/send-test`: preview message, không gửi.
- `POST /api/telegram/send-test`: gửi Telegram thật nếu đủ env.
- Zalo chưa bật trong V4.4.

### Auth tạm

- `src/app/api/auth/check/route.ts`

Chức năng:

- Basic Auth tạm qua env nếu `APP_BASIC_AUTH_ENABLED=true`.
- Đây chưa phải RBAC production đầy đủ.

### Tests

- `src/lib/import/parsers/__tests__/excel-parsers.test.ts`
- `src/lib/ai/__tests__/agent.test.ts`
- `src/lib/telegram/__tests__/telegram-client.test.ts`

## Lệnh đã chạy

| Lệnh | Kết quả |
|---|---|
| `npm install` | Pass |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run test` | Pass — 4 files, 6 tests |
| `npm run smoke` | Pass |
| `npm run kiem-tra-schema` | Pass — 39 sheet |
| `npm run static-ui-qa` | Pass |
| `npm run build` | Pass |
| `npm run start -- --port 3100` | Pass |

## Local API smoke test

| Endpoint | Kết quả |
|---|---|
| `GET /api/health` | 200 |
| `GET /api/google-sheets/health` | 503 khi thiếu env — đúng kỳ vọng |
| `GET /api/reports/dashboard` | 200 |
| `GET /api/ai/report-analysis` | 200 fallback rule-based khi thiếu OpenAI key |
| `GET /api/telegram/send-test` | 200 preview message |
| `GET /api/bot/telegram/send-test` | 200 preview message |
| `GET /api/bot/zalo/send-test` | 200 contract-only |

## Import real files smoke test

Test bằng 5 file thật đã có trong workspace:

- `Tong_Hop_Doanh_Thu.xlsx`
- `báo cáo doanh thu tại cửa hàng.xlsx`
- `SoQuy_KV22062026-172707-050.xlsx`
- `DanhSachKhoHang_KV22062026-174240-806.xlsx`
- `BÁO CÁO THẤT THOÁT NVL TUẦN.xlsx`

Kết quả preview:

| File | Loại nhận diện | Dòng mới | Trùng | Lệch | Lỗi |
|---|---:|---:|---:|---:|---:|
| Doanh thu app | Doanh thu app | 28 | 0 | 0 | 0 |
| Doanh thu cửa hàng | Doanh thu cửa hàng | 14 | 0 | 0 | 0 |
| Sổ quỹ | Sổ quỹ | 226 | 0 | 0 | 0 |
| Tồn kho | Tồn kho | 123 | 0 | 0 | 0 |
| Thất thoát NVL | Thất thoát NVL | 35 | 0 | 0 | 0 |
| Tổng | Batch 5 file | 426 | 0 | 0 | 0 |

Kết quả confirm local store:

- Ghi 426 dòng vào local data store thành công.
- Dashboard đọc lại dữ liệu đã import thành công.
- Tổng doanh thu sau import: khoảng 223.6tr.
- Tồn kho phát hiện 13 mặt hàng tồn âm.
- Thất thoát quy tiền tính được từ đơn giá trong file thất thoát.

## Env cần cấu hình trên Vercel

Không đưa value vào repo. Chỉ set trên Vercel Environment Variables.

- `DATA_STORE=google_sheets`
- `GOOGLE_SHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `APP_BASIC_AUTH_ENABLED`
- `APP_USERNAME`
- `APP_PASSWORD`

## Chưa test thật được trong môi trường này

Chưa thể xác nhận pass thật các mục sau vì không có `.env` thật trong runtime:

- Google Sheet service account truy cập spreadsheet thật.
- OpenAI API gọi model thật.
- Telegram gửi vào chat thật.
- Vercel runtime nhận đúng env.

Kết luận chính xác: code đã sẵn sàng cho Vercel Preview/Staging, nhưng production-live cần test các endpoint trên Vercel sau khi nhập env thật.

## Smoke test sau khi deploy Vercel Preview

1. `GET /api/health`
2. `GET /api/google-sheets/health` — phải `ok: true`
3. `POST /api/import/preview` với 5 file Excel thật
4. `POST /api/import/confirm` sau preview
5. `GET /api/reports/dashboard` — phải đọc số vừa import
6. `POST /api/ai/report-analysis` — phải `mode: real_openai`
7. `POST /api/telegram/send-test` — phải gửi tin nhắn thật

## Kết luận deploy

Được deploy Vercel Preview/Staging.

Chưa gọi production-live cho đến khi các test bằng secret thật trên Vercel đều pass.
