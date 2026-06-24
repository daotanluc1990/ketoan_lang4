# QA Report V4.8 — Cashflow + CEO Dashboard từ dữ liệu nguồn

## Mục tiêu

V4.8 kiểm tra và nâng cấp cách app dùng dữ liệu nguồn thật, đặc biệt là `DL_SO_QUY`.

Nguyên tắc:

- Không ghi dữ liệu giả vào Google Sheet production.
- Không xóa dữ liệu thật trên Google Sheet production.
- Dữ liệu giả chỉ tồn tại trong unit test bằng biến in-memory và được reset bằng `beforeEach`.
- Chỉ dòng có `Mã lần import` bắt đầu bằng `IMP-` và `Trạng thái dữ liệu = Đã xác nhận` mới được tính.

## Phạm vi đã làm

1. Kiểm tra source contract của 7 nguồn với schema 21 sheet.
2. Tạo fixture giả trong test cho đủ 7 nguồn:
   - `DL_DOANH_THU_CUA_HANG`
   - `DL_DOANH_THU_APP`
   - `DL_SO_QUY`
   - `DL_TON_KHO`
   - `DL_THAT_THOAT_NVL`
   - `DL_CONG_NO`
   - `DL_THU_MUA`
3. Kiểm tra dashboard khi có đủ dữ liệu giả:
   - CEO Dashboard có tổng doanh thu, dòng tiền, cảnh báo CEO.
   - Dòng tiền có so sánh tuần đang xem với tuần trước.
   - Sổ quỹ phát hiện trả NCC, capex, khoản chi lớn.
   - Bảng độ đủ dữ liệu hiển thị 7 nguồn.
4. Sau mỗi test, fixture giả được reset, không lưu vào file, không ghi Google Sheet.

## Thay đổi UI

### CEO Dashboard

Thêm:

- Bảng `Việc CEO cần nhìn ngay`.
- Bảng `Độ đủ dữ liệu theo 7 nguồn`.

### Dòng tiền Tuần

Thêm:

- Bảng `So sánh với tuần trước`.
- Bảng `Lịch sử dòng tiền theo tuần`.

## Điều kiện đạt

- Cùng dữ liệu giả cho cùng kết quả số học.
- Dữ liệu giả không chạm Google Sheet thật.
- Nếu thiếu nguồn, dashboard báo thiếu nguồn thay vì hiển thị 0 như dữ liệu thật.
- Khoản chi lớn trong sổ quỹ được phát hiện từ `DL_SO_QUY`.
- Khoản trả NCC/capex không bị đưa thẳng vào chi phí vận hành/P&L.

## Ghi chú triển khai

V4.8 vẫn chưa phải Agent Dự toán. Dự toán đầy đủ chỉ nên làm sau khi có tối thiểu 4 tuần dữ liệu sạch.
