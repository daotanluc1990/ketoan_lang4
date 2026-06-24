# Telegram/Zalo Contract

## Trạng thái

Tài liệu này thuộc blueprint đã duyệt cho app **Cơm Tấm Làng — CEO Report Dashboard**.

## Nguyên tắc chung

- UI và Google Sheet dùng tiếng Việt.
- Import phải có kiểm tra trước khi ghi.
- Không ghi đè tự động.
- Không bịa số nếu thiếu dữ liệu.
- Dashboard phải trả lời: tốt/xấu, vì sao, cần làm gì ngay.

## Phạm vi phase hiện tại

Phase 0–4 chỉ dựng nền app, docs, layout 8 tab, schema Google Sheet tiếng Việt, local data store, audit và import core foundation. Các nghiệp vụ parser/forecast/loss/AI/bot sẽ làm ở phase sau.

## V4.4 Telegram thật

### Endpoint

- `GET /api/telegram/send-test`: preview nội dung báo cáo, chưa gửi.
- `POST /api/telegram/send-test`: gửi Telegram thật nếu đủ env.

### Env

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

### Rule

- Không log token.
- Nếu thiếu env, API trả `missing_env` và không gửi.
- Zalo chưa bật trong V4.4, chỉ giữ contract cho phase sau.
