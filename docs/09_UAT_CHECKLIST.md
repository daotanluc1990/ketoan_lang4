# UAT Checklist — V4.6 Vercel Staging

## Mục tiêu

Xác nhận app dùng được trên Vercel Preview với dữ liệu Google Sheet thật, chỉ cho CEO và Kế toán truy cập.

## 1. Auth/RBAC

- [ ] Chưa login vào `/tong-quan` bị chuyển về `/login`.
- [ ] Chưa login gọi `/api/reports/dashboard` trả `401`.
- [ ] Chưa login gọi `/api/import/confirm` trả `401`.
- [ ] Chưa login gọi `/api/ai/report-analysis` trả `401`.
- [ ] Chưa login gọi `/api/telegram/send-test` trả `401`.
- [ ] CEO login thành công.
- [ ] Kế toán login thành công.
- [ ] Top bar hiển thị đúng tên và role thật.
- [ ] Không còn dropdown chọn role trên UI.
- [ ] Logout xong không còn xem được dashboard.

## 2. Google Sheet thật

- [ ] Vercel Env đã có `DATA_STORE=google_sheets`.
- [ ] Google Sheet đã share quyền Editor cho service account.
- [ ] `/api/google-sheets/health` trả `ok: true` sau đăng nhập.
- [ ] App đọc được sheet dashboard/import/audit.
- [ ] Không đổi tên sheet/header trong Google Sheet thật.

## 3. Dashboard CEO

- [ ] `/tong-quan` mở được sau login.
- [ ] KPI chính hiển thị từ dữ liệu thật hoặc báo thiếu dữ liệu rõ ràng.
- [ ] Dashboard trả lời được: tốt/xấu, vì sao, cần làm gì ngay.
- [ ] Khi thiếu dữ liệu phải hiển thị: `Chưa đủ dữ liệu để kết luận.`

## 4. Kế toán/import

- [ ] Upload Excel preview pass.
- [ ] File lỗi không cho confirm.
- [ ] Dữ liệu lệch không cho confirm nếu chưa xử lý.
- [ ] Confirm import chỉ ghi khi preview pass.
- [ ] `IMPORT_LICH_SU` ghi đúng batch.
- [ ] `AUDIT_LOG` ghi đúng người dùng/role.
- [ ] Rollback yêu cầu lý do.

## 5. AI Agent

- [ ] API AI chỉ chạy sau đăng nhập.
- [ ] Nếu thiếu Gemini/OpenAI key, fallback rule-based an toàn.
- [ ] Nếu thiếu dữ liệu, trả `Chưa đủ dữ liệu để kết luận.`
- [ ] Không bịa số hoặc kết luận gian lận khi thiếu bằng chứng.
- [ ] Audit log ghi `AI_REPORT_ANALYSIS` nếu data store ghi được.

## 6. Telegram

- [ ] `GET /api/telegram/send-test` chỉ preview, không gửi thật.
- [ ] `POST /api/telegram/send-test` chỉ gửi sau login.
- [ ] Nội dung gửi không chứa secret.
- [ ] Audit log ghi `TELEGRAM_SEND`.
- [ ] Nếu muốn tắt gửi thật, xóa `TELEGRAM_BOT_TOKEN` hoặc `TELEGRAM_CHAT_ID` trong Vercel Env.

## 7. Kết luận UAT

- [ ] CEO duyệt UX.
- [ ] Kế toán duyệt workflow nhập liệu.
- [ ] 1 tuần test dữ liệu thật pass.
- [ ] Không có lỗi RBAC/secret/import nghiêm trọng.
- [ ] Có rollback plan rõ ràng.
