# QA Report — Production-style Code V4.2

## Scope

Đưa HTML preview V4.1 QA Fixed vào code Next.js production-style.

## Kết quả chính

- 9 tab đúng cấu trúc CEO / Báo cáo quản trị / Kế toán / Hệ thống.
- Sidebar có thu gọn/mở rộng và vùng cuộn nội bộ.
- Filter bar toàn cục.
- KPI có badge cảnh báo.
- Bàn làm việc kế toán có checklist, trạng thái báo cáo, batch upload, chốt báo cáo mock, gửi CEO/Bot mock.
- Báo cáo thất thoát chi tiết có Top 5 NVL, tỷ lệ thất thoát, định mức, vượt định mức.
- Có static QA script: `npm run static-ui-qa`.

## QA đã thiết kế

| Checklist | Trạng thái |
|---|---|
| Navigation đủ 9 tab | Có script kiểm tra |
| Sidebar scroll nội bộ | Có script kiểm tra |
| Role selector mock | Có script kiểm tra |
| Filter bar | Có script kiểm tra |
| Batch upload nhiều file | Có script kiểm tra |
| Tab thất thoát chi tiết | Có script kiểm tra |
| Bàn làm việc kế toán | Có script kiểm tra |

## Chưa test được trong môi trường xuất file

Chưa chạy được `npm install`, `npm run build`, `npm run lint`, `npm run test` nếu môi trường không có dependencies.

## Không gọi production-live

Bản này chưa production-live vì chưa có:

- dữ liệu thật;
- đăng nhập thật;
- RBAC server-side;
- Google Sheet write thật;
- Telegram/Zalo live;
- UAT với kế toán thật.
