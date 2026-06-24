# Risk & Rollback — V4.6 Security Gate

## Rủi ro chính

1. Sai cấu hình AUTH_* làm không đăng nhập được.
2. Service account chưa được share quyền Editor nên không đọc/ghi Google Sheet.
3. Google Sheet thật còn dữ liệu mẫu hoặc header bị đổi làm dashboard sai.
4. Import confirm ghi dữ liệu thật nhưng file kế toán chưa được kiểm đủ.
5. Telegram gửi báo cáo thật khi nội dung chưa được duyệt.
6. Gemini/OpenAI AI Agent phân tích thiếu dữ liệu nếu nguồn chưa đủ.
7. Không có `package-lock.json` có thể làm build Vercel lệch dependency.

## Rollback nhanh

### Nếu không đăng nhập được

1. Kiểm tra `AUTH_CEO_USERNAME`, `AUTH_CEO_PASSWORD`, `AUTH_ACCOUNTANT_USERNAME`, `AUTH_ACCOUNTANT_PASSWORD`.
2. Kiểm tra `AUTH_SESSION_SECRET` đã có và đủ dài.
3. Nếu cần mở tạm staging: đặt `AUTH_ENABLED=false`, redeploy Preview, sau đó sửa lại và bật lại.

### Nếu Google Sheet lỗi

1. Kiểm tra `DATA_STORE=google_sheets`.
2. Kiểm tra `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`.
3. Share Google Sheet quyền Editor cho service account.
4. Không import confirm cho đến khi `/api/google-sheets/health` pass.

### Nếu import lỗi

1. Dừng confirm import.
2. Chỉ chạy preview để xem lỗi.
3. Dùng `IMPORT_LICH_SU`, `IMPORT_DONG_LOI`, `IMPORT_DU_LIEU_LECH`, `AUDIT_LOG` để xác định batch.
4. Sửa file nguồn hoặc mapping rồi preview lại.
5. Không xóa dữ liệu thủ công nếu chưa có đối chiếu batch.

### Nếu Telegram gửi sai

1. Xóa `TELEGRAM_BOT_TOKEN` hoặc `TELEGRAM_CHAT_ID` khỏi Vercel Env.
2. Redeploy.
3. Kiểm tra `AUDIT_LOG` để biết ai gửi và thời điểm gửi.
4. Chỉ bật lại sau khi preview nội dung pass.

### Nếu build/deploy lỗi

1. Quay lại bản zip/commit V4.5.1.
2. Không deploy production.
3. Sửa lỗi trên local/staging trước.
4. Chỉ production-live khi Vercel Preview và UAT pass.
