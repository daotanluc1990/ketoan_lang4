# QA Report — V4.9 Data Quality + Accounting Workbench Agent

## Scope

V4.9 triển khai agent rule-based để kiểm tra 21 sheet Data Master, đánh giá 7 nguồn dữ liệu chính, đọc import control sheets và sinh việc kế toán cần xử lý.

## Đã làm

- Thêm Data Quality Engine.
- Thêm Accounting Workbench Agent.
- Thêm API `/api/data-quality`.
- Thêm API `/api/accounting-workbench/tasks`.
- Bàn làm việc kế toán chuyển từ checklist tĩnh sang checklist/task động.
- CEO Dashboard thêm Data Quality Summary và top task kế toán.
- Tạo Agent Blueprint theo chuẩn `docs/SKILL_AGENT_STRUCTURE_GUIDE.md`.

## Nguyên tắc an toàn

- Không ghi Google Sheet.
- Không xóa dữ liệu.
- Không rollback thật.
- Không dùng Gemini để quyết định đúng/sai dữ liệu.
- Dòng nguồn hợp lệ vẫn phải có `Mã lần import` bắt đầu bằng `IMP-` và `Trạng thái dữ liệu = Đã xác nhận`.

## QC đã chạy trong môi trường hiện tại

| Command | Result | Notes |
|---|---:|---|
| `npm run static-ui-qa` | PASS | 9 tab, filter compact, sidebar, KPI, import, thất thoát, accountant workflow |

## Chưa chạy được trong môi trường hiện tại

`npm install` bị timeout khi tải dependency, nên chưa chạy lại được:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Cần chạy lại đầy đủ trên máy/Vercel có dependency trước khi gọi staging-ready.

## UAT đề xuất

1. Login CEO/Kế toán.
2. Mở `/ban-lam-viec-ke-toan?weekCode=2026-W26`.
3. Kiểm tra Data Quality Score.
4. Kiểm tra 7 nguồn dữ liệu.
5. Kiểm tra task thiếu nguồn, task trả NCC, task capex, task import lỗi/trùng/lệch nếu có.
6. Mở `/api/data-quality?weekCode=2026-W26`.
7. Mở `/api/accounting-workbench/tasks?weekCode=2026-W26`.

## Remaining risks

- Bản này đọc 21 sheet để tạo data quality, cần kiểm tra tốc độ trên Vercel với Google Sheet thật.
- Nếu task quá nhiều, cần gom task theo batch/nguồn ở V5.x.
- Production chỉ nên chạy sau khi full build/test pass và UAT dữ liệu thật.
