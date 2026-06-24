# QA REPORT — V4.5.1 Production Data Strict Recheck

## Tình hình chung
Sau khi hỏi lại, QA lại theo AGENTS.md phát hiện bản V4.5.1 cũ **chưa đạt full QA**.
Đã sửa lỗi và chạy lại các nhóm kiểm tra chính.

## Đã đọc
- AGENTS.md
- package.json
- các file page liên quan đến Dashboard/P&L
- import parser tests
- Google Sheet Data Master qua connector

## Lỗi phát hiện ở bản cũ
1. `npm run lint` fail do thiếu `key` trong map ở:
   - `src/app/pl-tuan/page.tsx`
   - `src/app/tong-quan/page.tsx`
2. `npm run test` fail do test cũ còn kiểm tra tên cột cũ:
   - `Loại thu chi` thay vì `Loại giao dịch`
   - `Trạng thái tồn` thay vì `Trạng thái tồn âm`
3. `npm run smoke` fail vì script còn yêu cầu schema >= 30 sheet, trong khi V4.5.1 dùng 21 sheet đã chốt.
4. Google Sheet vẫn còn dữ liệu mẫu cũ ở `DL_DOANH_THU_APP` dòng 4+, nhưng tool ghi/xóa bị chặn nên chưa xóa được trực tiếp.

## Đã sửa
- Thêm `key={kpi.label}` cho KPI maps.
- Cập nhật unit test parser theo cột Data Master V4.5.1.
- Cập nhật smoke test schema threshold từ 30 xuống 21 sheet.

## QA đã chạy sau khi sửa
- `npm run lint` — PASS
- `npm run test` — PASS, 4 files / 6 tests
- `npm run smoke` — PASS
- `npm run kiem-tra-schema` — PASS, 21 sheet tiếng Việt
- `npm run static-ui-qa` — PASS
- `npm run typecheck` — PASS
- `npm run build` — PASS ở lần chạy riêng: compiled, typechecked, generated pages successfully.

## Lưu ý môi trường
Sau khi xóa `node_modules` để đóng gói sạch, một lần chạy gộp `npm install + all QA` bị timeout trong container. Trước đó các lệnh riêng đã pass sau khi sửa. Vercel vẫn cần build lại từ source mới.

## Kết luận
Bản đã sửa đạt QA chính theo agent ở mức source/staging package. Chưa gọi production-live cho đến khi deploy Vercel lại và test API với env thật.
