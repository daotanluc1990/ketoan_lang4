# QA Report — V4.7.1 Cashbook Intelligence & Strict Import Rows

## Tình hình chung

Đạt ở mức source package / Vercel Preview Candidate.

V4.7.1 chỉnh lại sau khi kiểm tra Google Sheet thật: hiện `DL_SO_QUY` đã có dữ liệu thu/chi thật, nên sổ quỹ phải được dùng để phát hiện dòng tiền, khoản chi lớn, nhóm chi bất thường và việc kế toán cần xử lý. Đồng thời siết điều kiện dòng dữ liệu hợp lệ để không lấy nhầm nội dung mẫu trong các sheet chưa import.

## Files/areas changed

- `src/lib/reports/report-filters.ts`
  - Chỉ coi dòng nguồn là hợp lệ khi `Mã lần import` bắt đầu bằng `IMP-` và `Trạng thái dữ liệu = Đã xác nhận`.
- `src/lib/reports/cashbook-analysis.ts`
  - Thêm bộ phân tích sổ quỹ: phân loại chi theo diễn giải, phát hiện trả NCC/công nợ, capex/đầu tư, thuê mặt bằng, điện/nước/gas, NVL/bao bì, sửa chữa/bảo trì, nhân sự và nhóm Khác cần phân loại.
- `src/lib/reports/report-aggregator.ts`
  - Dùng `DL_SO_QUY` để tạo KPI tiền vào/ra, dòng tiền tạm, chi cần phân loại, chi lớn bất thường.
  - Bổ sung `cashbookGroupRows`, `cashbookLargeExpenseRows`, `accountingTaskRows`.
  - Không đưa thẳng trả NCC/capex/nhóm Khác vào P&L nếu chưa có đối chiếu.
- `src/app/dong-tien/page.tsx`
  - Thêm bảng “Chi theo nhóm từ sổ quỹ”.
  - Thêm bảng “Top khoản chi lớn cần kiểm tra”.
- `src/app/ban-lam-viec-ke-toan/page.tsx`
  - Việc kế toán ưu tiên lấy từ `accountingTaskRows`: phân loại nhóm Khác, đối chiếu trả NCC, tách capex, kiểm khoản chi lớn.
- `src/app/api/reports/dong-tien/route.ts`
  - Trả thêm dòng nhóm chi, khoản chi lớn và task kế toán.
- Tests cập nhật cho strict valid import row và phân tích sổ quỹ.

## What works

- Dòng mẫu/báo cáo cũ trong sheet nguồn không còn bị tính là dữ liệu thật.
- Nếu chỉ có `DL_SO_QUY`, dashboard vẫn hiển thị được phần dòng tiền, nhưng các phần doanh thu/P&L/thất thoát/tồn kho vẫn báo thiếu nguồn.
- Sổ quỹ được dùng để phát hiện khoản chi lớn thất thường.
- Sổ quỹ được dùng để tạo cảnh báo CEO và task kế toán.
- Tiền trả NCC/công nợ phải đối chiếu `DL_CONG_NO` trước khi kết luận là chi phí tuần.
- Khoản đầu tư/capex phải tách khỏi chi phí vận hành/P&L.
- Nhóm Khác phải được phân loại lại trước khi chốt báo cáo.

## Commands run

| Command | Result |
|---|---|
| `npm install` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS — 6 files / 12 tests |
| `npm run build` | PASS |
| `npm run static-ui-qa` | PASS |

## Remaining risks

- Logic phân loại sổ quỹ dựa trên diễn giải, nên vẫn cần kế toán kiểm lại trước khi chốt.
- Nếu diễn giải quá thiếu hoặc sai chính tả nặng, hệ thống sẽ đưa vào nhóm `Khác cần phân loại`.
- P&L vẫn chưa hoàn chỉnh nếu chưa có doanh thu/tồn kho/thất thoát/công nợ/thu mua.
- Rollback dữ liệu thật theo mã import vẫn là giai đoạn sau.

## Next recommended step

Deploy Vercel Preview bản V4.7.1, login CEO/Kế toán, chọn tuần có dữ liệu sổ quỹ, kiểm:

```text
/dong-tien?weekCode=2026-W26
/tong-quan?weekCode=2026-W26
/ban-lam-viec-ke-toan?weekCode=2026-W26
/api/reports/dong-tien?weekCode=2026-W26
```
