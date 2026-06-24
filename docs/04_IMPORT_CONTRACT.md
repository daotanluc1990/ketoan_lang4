# Import Contract

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

## V4.4 Import Excel thật

### Endpoint

`POST /api/import/preview` hỗ trợ 2 mode:

1. JSON rows chuẩn hóa sẵn.
2. Multipart form-data với field `files` hoặc `file`, hỗ trợ nhiều file `.xlsx/.xls/.csv`.

### File nhận diện được

- Tổng hợp doanh thu app.
- Báo cáo doanh thu tại cửa hàng.
- Sổ quỹ KiotViet.
- Danh sách kho hàng KiotViet.
- Báo cáo thất thoát NVL tuần.

### Luồng an toàn

Upload file → nhận diện → parse → preview dòng mới/trùng/lệch/lỗi → kế toán xác nhận → append Google Sheet/local store.

Không upload xong rồi ghi ngay.
