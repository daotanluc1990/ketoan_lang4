# Pre-Vercel Deploy QC Result — V4.6.1

## Tình hình chung

Đạt ở mức có thể đưa lên Vercel Preview sau khi cấu hình Environment Variables và bật Deployment Protection trong tài khoản Vercel.

Chưa gọi production-live vì cần UAT bằng dữ liệu thật trên Vercel Preview.

## Việc đã làm

1. Tạo `package-lock.json` để cố định dependency khi Vercel build.
2. Sửa lỗi ESLint trong `src/components/layout/AppShell.tsx`.
3. Cấu hình `experimental.cpus = 1` trong `next.config.ts` để tránh build dùng quá nhiều worker trong môi trường giới hạn tài nguyên.
4. Chạy full local QC sau khi cài dependencies.

## Commands đã chạy

| Command | Result | Notes |
|---|---|---|
| `npm install` | PASS | Tạo/cập nhật `package-lock.json`, cài 472 packages |
| `npm run typecheck` | PASS | TypeScript no error |
| `npm run lint` | PASS | 0 error, 0 warning |
| `npm run test` | PASS | 4 test files, 6 tests passed |
| `npm run build` | PASS | Next.js build completed, route manifest generated |
| `npm run static-ui-qa` | PASS | 9 tabs, filter compact, sidebar, KPI, import, loss detail, accountant workflow |

## Security/Audit note

`npm audit` vẫn còn cảnh báo từ dependency:

- Production dependencies: 7 vulnerabilities, gồm 6 moderate và 1 high.
- `xlsx` có cảnh báo high và hiện npm báo no fix available.
- `next/postcss` và `@googleapis/sheets/uuid` có đề xuất fix breaking-change nên chưa tự động nâng cấp trong bản này.

Khuyến nghị cho Vercel Preview:

- Chỉ cho CEO/Kế toán đã đăng nhập dùng.
- Bật Vercel Deployment Protection bên ngoài app.
- Chỉ upload/import file Excel từ nguồn nội bộ tin cậy.
- Chưa mở public internet/production-live.

## Vercel Preview Protection cần làm trong tài khoản Vercel

Không thể bật tự động trong source code vì cần quyền truy cập tài khoản Vercel.

Checklist thao tác:

1. Vào Vercel Project.
2. Mở `Settings`.
3. Mở `Deployment Protection`.
4. Bật protection cho Preview deployments.
5. Ưu tiên dùng Vercel Authentication. Nếu plan hỗ trợ, có thể dùng thêm Password Protection.
6. Chỉ chia link preview cho CEO/Kế toán.

## Vercel Environment Variables cần cấu hình

Nhập từng biến trong Vercel Project Settings, không commit `.env` vào repo.

```env
DATA_STORE=google_sheets
GOOGLE_SHEET_ID=<Google Sheet ID thật>
GOOGLE_CLIENT_EMAIL=<service account email>
GOOGLE_PRIVATE_KEY=<private key>

AUTH_ENABLED=true
AUTH_SESSION_SECRET=<chuỗi bí mật dài>
AUTH_SESSION_MAX_AGE_HOURS=12
AUTH_CEO_USERNAME=<tài khoản CEO>
AUTH_CEO_PASSWORD=<mật khẩu CEO>
AUTH_CEO_NAME=CEO
AUTH_ACCOUNTANT_USERNAME=<tài khoản kế toán>
AUTH_ACCOUNTANT_PASSWORD=<mật khẩu kế toán>
AUTH_ACCOUNTANT_NAME=Kế toán

AI_PROVIDER=gemini
GEMINI_API_KEY=<để trống nếu chưa bật AI thật>
GEMINI_MODEL=gemini-2.5-flash

# Optional fallback only if switching provider later
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

TELEGRAM_BOT_TOKEN=<để trống trong lần deploy đầu nếu chưa test gửi thật>
TELEGRAM_CHAT_ID=<để trống trong lần deploy đầu nếu chưa test gửi thật>
```

## Google Sheet checklist

1. Tạo service account trong Google Cloud.
2. Copy email service account vào `GOOGLE_CLIENT_EMAIL`.
3. Share Google Sheet Data Master quyền Editor cho service account.
4. Không nhập token/private key/password vào Google Sheet.
5. Sau deploy, test `/api/google-sheets/health` khi đã đăng nhập.

## UAT sau deploy Preview

1. Mở preview URL khi chưa đăng nhập → phải về `/login`.
2. Gọi API nhạy cảm khi chưa login → phải trả `401`.
3. Login CEO → xem dashboard, P&L, dòng tiền, thất thoát.
4. Login Kế toán → vào bàn làm việc kế toán, import preview.
5. Test Google Sheet health.
6. Test import preview với file nhỏ.
7. Chỉ confirm import khi preview không có lỗi/lệch.
8. Kiểm tra `IMPORT_LICH_SU` và `AUDIT_LOG` sau thao tác ghi.
9. Chỉ bật Telegram env sau khi dashboard và import đã đúng.

## Rollback nhanh

Nếu login lỗi toàn app:

- Tạm set `AUTH_ENABLED=false` trong Vercel Preview Env để mở app kiểm tra.
- Không dùng cho production-live.

Nếu Google Sheet lỗi:

- Kiểm tra service account, private key format, quyền Editor, và `DATA_STORE=google_sheets`.

Nếu Telegram gửi sai:

- Xóa `TELEGRAM_BOT_TOKEN` hoặc `TELEGRAM_CHAT_ID` khỏi Vercel Env rồi redeploy.

## Kết luận

Bản này đủ điều kiện để đưa lên Vercel Preview/Staging sau khi cấu hình Env và bật Deployment Protection. Chưa đủ điều kiện production-live nếu chưa UAT dữ liệu thật ít nhất 1 chu kỳ báo cáo.
