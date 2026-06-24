# Agent Blueprint — Accounting Workbench Agent

## 1. Mission / Mục tiêu

Tự kiểm tra chất lượng dữ liệu kế toán trên 21 sheet Data Master, phát hiện nguồn thiếu/lỗi/trùng/lệch, kết hợp phân tích sổ quỹ để sinh danh sách việc kế toán cần xử lý trước khi chốt báo cáo CEO.

## 2. Role / System Prompt

Bạn là Accounting Workbench Agent dạng rule-based cho Cơm Tấm Làng. Bạn không tự tạo số, không dùng Gemini để phán đoán đúng/sai dữ liệu. Bạn chỉ đọc kết quả từ Data Quality Engine, Source Contract, Import Control và Cashbook Intelligence để sinh việc cần làm rõ ràng, có bằng chứng, owner và deadline.

## 3. Users / Người dùng phục vụ

- CEO: xem nguồn nào thiếu, việc nào cần duyệt, có thể chốt báo cáo chưa.
- Kế toán: biết phải import gì, sửa gì, đối chiếu gì, phân loại khoản nào.

## 4. Scope

Trong phạm vi:
- Kiểm tra 21 sheet có dữ liệu/cột/dòng hợp lệ.
- Kiểm tra 7 nguồn dữ liệu chính.
- Đọc IMPORT_DONG_LOI, IMPORT_DU_LIEU_TRUNG, IMPORT_DU_LIEU_LECH, IMPORT_LICH_SU.
- Sinh task kế toán và task cần CEO duyệt.

Ngoài phạm vi:
- Không ghi Google Sheet.
- Không xóa dữ liệu.
- Không rollback thật.
- Không tạo dự toán.
- Không gửi Telegram tự động.

## 5. Inputs

- 21 sheet Google Sheet Data Master.
- Source Contract của 7 nguồn.
- Dữ liệu đã lọc theo query params: kỳ, chi nhánh, kênh, trạng thái.
- Kết quả Cashbook Intelligence từ DL_SO_QUY.
- Import control sheets.

## 6. Tools / Integrations

- Google Sheets read-only thông qua data store.
- `buildDataQualityReport()`.
- `analyzeCashbookRows()`.
- `buildAccountingWorkbenchTasks()`.
- API `/api/data-quality`.
- API `/api/accounting-workbench/tasks`.

## 7. Memory / Knowledge

- Sheet schema trong `src/lib/google-sheets/schema.ts`.
- Source Contract trong `src/lib/reports/source-contract.ts`.
- Rule dữ liệu hợp lệ: `Mã lần import` bắt đầu bằng `IMP-` và `Trạng thái dữ liệu = Đã xác nhận`.
- Quy tắc kế toán: sổ quỹ phát hiện tiền ra/vào, nhưng trả NCC/capex/Khác không đưa thẳng vào P&L nếu chưa đối chiếu.

## 8. LLM Strategy

Không dùng LLM trong V4.9. Đây là agent dạng rule-based để bảo đảm nhanh, kiểm chứng được và phù hợp Vercel.

LLM/Gemini chỉ có thể dùng ở phiên bản sau để viết tóm tắt CEO từ kết quả đã tính, không được tính số hoặc quyết định dữ liệu đúng/sai.

## 9. Sequence / Orchestration

1. Đọc 21 sheet.
2. Xác định nhóm sheet: nguồn dữ liệu, báo cáo/công việc, import/audit, cấu hình.
3. Kiểm tra 7 nguồn chính theo source contract.
4. Đếm dòng hợp lệ/chưa hợp lệ.
5. Đọc import error/duplicate/conflict/history.
6. Phân tích sổ quỹ.
7. Sinh task kế toán.
8. Đánh điểm Data Quality.
9. Trả về UI Bàn làm việc kế toán và CEO Dashboard.

## 10. RBAC / Permission Rules

- CEO: xem toàn bộ task và task cần CEO duyệt.
- Kế toán: xem toàn bộ task và thực hiện xử lý dữ liệu.
- Chưa có Admin/Quản lý chi nhánh trong V4.9.
- API phải được khóa bằng session/RBAC server-side.

## 11. Output Format

Mỗi task gồm:

- Mức độ
- Việc cần làm
- Nguồn dữ liệu
- Bằng chứng
- Owner
- Deadline
- Cần CEO duyệt
- Hành động đề xuất

## 12. Testing / Evaluation

- Test thiếu nguồn bắt buộc sinh task.
- Test dòng mẫu/chưa xác nhận không được tính.
- Test import lỗi/trùng/lệch sinh task.
- Test trả NCC/capex từ sổ quỹ sinh task đúng.
- Test không ghi/xóa Google Sheet.

## 13. Anti-error Rules

- Không hiển thị 0 thay cho dữ liệu thiếu.
- Không kết luận P&L khi thiếu doanh thu hoặc nguồn đối chiếu.
- Không đưa trả NCC/capex vào chi phí vận hành nếu chưa đối chiếu.
- Không dùng Gemini để phán đoán dữ liệu đúng/sai.
- Không chốt báo cáo nếu còn nguồn bắt buộc thiếu hoặc task nguy hiểm/cần duyệt.

## 14. Definition of Done

- Bàn làm việc kế toán không còn checklist tĩnh là nguồn chính.
- Có API data quality.
- Có API task kế toán.
- CEO Dashboard thấy Data Quality Summary và top task.
- Static UI QA pass.
- Không ghi dữ liệu thật trong V4.9.
