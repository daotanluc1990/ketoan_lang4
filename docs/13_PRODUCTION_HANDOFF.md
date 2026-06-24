# Production Handoff — Cơm Tấm Làng CEO Report Dashboard V4.6

## Mục tiêu

Web dùng cho CEO và Kế toán:

- CEO xem dashboard, P&L, dòng tiền, cân đối, dự toán, thất thoát.
- Kế toán nhập/import file, đối soát, chốt báo cáo, gửi CEO/Bot.

## Luồng vận hành đề xuất

1. CEO/Kế toán đăng nhập tại `/login`.
2. Kế toán vào `Bàn làm việc kế toán`.
3. Chọn kỳ báo cáo trên filter bar.
4. Upload batch nhiều file.
5. Chạy preview/kiểm tra batch.
6. Xử lý dòng lỗi/trùng/lệch.
7. Confirm import khi dữ liệu pass.
8. CEO xem dashboard.
9. Xem trước Telegram.
10. Gửi bot sau khi đủ điều kiện.

## Điều kiện để lên production-live

- Có đăng nhập thật bằng session cookie httpOnly.
- Có RBAC server-side cho đúng 2 role: `CEO`, `Kế toán`.
- API import, conflicts, reports, AI, Telegram, Google Sheet health đều khóa quyền.
- Có Google Sheet thật và quyền truy cập an toàn.
- Parser Excel thật chạy được với file KiotViet/app/sổ quỹ/tồn kho/thất thoát.
- Import có preview, confirm, audit, rollback reason.
- Bot Telegram gửi test thành công sau khi preview nội dung đúng.
- UAT ít nhất 1 tuần với kế toán.

## Rollback

Nếu lỗi:

1. Ngưng gửi bot thật bằng cách xóa Telegram env.
2. Khóa import ghi dữ liệu bằng cách không bấm confirm hoặc tắt quyền service account tạm thời.
3. Quay lại báo cáo Excel tuần trước nếu dashboard chưa tin cậy.
4. Dùng import log/audit log để xác định batch lỗi.
5. Sửa parser/mapping, chạy lại dry-run/preview trước khi ghi.
6. Nếu auth lỗi nghiêm trọng ở staging, tạm đặt `AUTH_ENABLED=false`, redeploy, rồi sửa lại.
