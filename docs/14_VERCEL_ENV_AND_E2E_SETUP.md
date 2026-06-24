# Hướng dẫn cấu hình Vercel Env và test E2E V4.6

## 1. Không upload `.env` lên GitHub

Chỉ copy từng biến vào Vercel:

`Vercel → Project → Settings → Environment Variables`

Không commit `.env`, `.env.local`, service account JSON, Telegram token, Gemini/OpenAI key, private key, password.

## 2. Biến bắt buộc cho Vercel Preview/Staging

```env
DATA_STORE=google_sheets
GOOGLE_SHEET_ID=<Google Sheet ID từ link Data Master anh đã gửi>
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=

AUTH_ENABLED=true
AUTH_SESSION_SECRET=
AUTH_SESSION_MAX_AGE_HOURS=12
AUTH_CEO_USERNAME=
AUTH_CEO_PASSWORD=
AUTH_CEO_NAME=CEO
AUTH_ACCOUNTANT_USERNAME=
AUTH_ACCOUNTANT_PASSWORD=
AUTH_ACCOUNTANT_NAME=Kế toán

AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# Optional fallback only if switching provider later
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 3. Google Sheet thật

- Google Sheet Data Master: `CEO_REPORT_DATA_MASTER_COM_TAM_LANG_V5_AUTO_IMPORT`.
- Share quyền Editor cho `GOOGLE_CLIENT_EMAIL` của service account.
- Không đổi tên sheet/header nếu app đang dùng.
- Không nhập Telegram token, Gemini/OpenAI key hoặc private key vào Google Sheet. Chỉ nhập trong Vercel Env.

## 4. Auth/RBAC V4.6

- App có trang `/login`.
- Chỉ có 2 role: `CEO`, `Kế toán`.
- Role không còn được chọn bằng dropdown UI.
- Session nằm trong cookie `httpOnly`; client không tự gán quyền được.
- API import, conflicts, reports, AI, Telegram, Google Sheets health đều bị khóa bằng server-side RBAC.

## 5. Test sau deploy Vercel Preview

### Chưa đăng nhập

Mở các URL sau phải bị chuyển về `/login` hoặc trả `401`:

```text
/tong-quan
/api/reports/dashboard
/api/import/history
/api/ai/report-analysis
/api/telegram/send-test
/api/google-sheets/health
```

### Đăng nhập CEO

- Đăng nhập bằng tài khoản CEO.
- Mở `/tong-quan` pass.
- Mở `/api/google-sheets/health` trả `ok: true` khi service account đúng.
- Xem dashboard, P&L, dòng tiền, cân đối, thất thoát pass.
- Xem trước Telegram bằng `GET /api/telegram/send-test` pass.
- Chỉ gửi Telegram thật khi nội dung preview đúng.

### Đăng nhập Kế toán

- Đăng nhập bằng tài khoản Kế toán.
- Mở `Bàn làm việc kế toán` pass.
- Upload/import preview Excel pass.
- Confirm import chỉ khi preview không có dòng lỗi/lệch.
- Audit log ghi đúng người dùng/role.

## 6. Khi nào được gọi production-live

Chỉ khi:

- Vercel Preview build pass.
- Auth CEO/Kế toán pass.
- API chưa login trả `401` pass.
- Google Sheet health `ok: true`.
- Import preview 5 file pass.
- Import confirm ghi Google Sheet pass.
- Dashboard đọc số thật pass.
- AI Agent trả fallback an toàn hoặc `mode: real_gemini` nếu đã cấu hình Gemini key. Nếu đổi sang OpenAI thì chấp nhận `mode: real_openai`.
- Telegram gửi tin nhắn thật pass sau khi CEO/Kế toán duyệt nội dung.
- UAT ít nhất 1 tuần với kế toán pass.
