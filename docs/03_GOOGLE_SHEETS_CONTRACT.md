# Google Sheets Contract tiếng Việt

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

## V4.4 End-to-End Contract

### Sheet source of truth

- Nguồn dữ liệu chính giai đoạn V4.4: Google Sheet Data Master.
- App chỉ append dòng mới sau khi kế toán preview và xác nhận.
- Không tự tạo sheet, không tự sửa header, không ghi đè header.
- Nếu sheet thiếu header: API báo lỗi và dừng.

### Env bắt buộc

- `DATA_STORE=google_sheets`
- `GOOGLE_SHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

### API

- `GET /api/google-sheets/health`: kiểm tra service account có truy cập được spreadsheet không.
- `GET /api/reports/dashboard`: đọc dữ liệu từ Google Sheet/local store và tổng hợp KPI.
- `GET /api/reports/tong-quan`: alias cho dashboard report.

### Safety

- Write path chỉ nằm ở `POST /api/import/confirm`.
- Import phải đi qua `POST /api/import/preview` trước.
- Dòng lỗi/lệch không được ghi nếu chưa bật confirm partial rõ ràng.

---

## V4.7 — Data Filter & Source Contract

V4.7 thêm hợp đồng lọc dữ liệu dùng chung cho 7 sheet nguồn. Mục tiêu là để UI, API và báo cáo cùng hiểu một bộ lọc giống nhau, không còn filter hard-code chỉ đổi trên giao diện.

### 7 source tabs được chuẩn hóa

| Source key | Google Sheet | Cột ngày | Cột tuần | Cột chi nhánh | Cột kênh/nhóm | Cột trạng thái |
|---|---|---|---|---|---|---|
| `storeRevenue` | `DL_DOANH_THU_CUA_HANG` | `Ngày` | `Mã tuần`, `Tuần` | `Chi nhánh` | `Ca bán`, `Kênh bán` | `Trạng thái dữ liệu` |
| `appRevenue` | `DL_DOANH_THU_APP` | `Ngày` | `Mã tuần`, `Tuần` | `Chi nhánh` | `Kênh bán`, `Tài khoản app` | `Trạng thái dữ liệu` |
| `cashbook` | `DL_SO_QUY` | `Ngày` | `Mã tuần`, `Tuần` | `Chi nhánh` | `Phương thức`, `Nhóm thu/chi` | `Trạng thái dữ liệu` |
| `inventory` | `DL_TON_KHO` | `Ngày kiểm kê`, `Ngày` | `Mã tuần`, `Tuần` | `Chi nhánh` | `Nhóm hàng` | `Trạng thái dữ liệu` |
| `lossRows` | `DL_THAT_THOAT_NVL` | `Tuần bắt đầu`, `Ngày` | `Mã tuần`, `Tuần`, `Năm` | `Chi nhánh` | `Loại nguyên vật liệu` | `Trạng thái dữ liệu` |
| `debt` | `DL_CONG_NO` | `Ngày`, `Đến hạn` | `Mã tuần`, `Tuần` | `Chi nhánh` | `Nhóm công nợ`, `Nhà cung cấp/Đối tượng` | `Trạng thái dữ liệu` |
| `purchase` | `DL_THU_MUA` | `Ngày` | `Mã tuần`, `Tuần` | `Chi nhánh` | `Mặt hàng`, `NCC` | `Trạng thái dữ liệu` |

### Query params chuẩn

```text
fromDate=YYYY-MM-DD
toDate=YYYY-MM-DD
weekCode=2026-W23
branch=Làng NVT
channel=Grab
costGroup=NVL
source=appRevenue|storeRevenue|cashbook|inventory|lossRows|debt|purchase|all
dataStatus=Đã xác nhận
alertStatus=Cảnh báo
importedBy=Kế toán
```

### Metadata bắt buộc khi trả báo cáo

Mỗi báo cáo được tạo từ `buildDashboardReport()` phải trả thêm:

- `filterMetadata.appliedFilter`
- `filterMetadata.sourceRowCountsBefore`
- `filterMetadata.sourceRowCountsAfter`
- `filterMetadata.activeFilterCount`
- `filterMetadata.filterSummary`
- `filterMetadata.evidence`

Nếu sau lọc không còn dòng hợp lệ, UI/API phải báo `Chưa đủ dữ liệu để kết luận`, không mặc định bằng 0.


## V4.7.1 — Strict source row & cashbook relationship

Một dòng nguồn chỉ được tính vào báo cáo khi:

- `Mã lần import` bắt đầu bằng `IMP-`.
- `Trạng thái dữ liệu = Đã xác nhận`.

Quy tắc này tránh việc lấy nhầm dòng mẫu, dòng mô tả hoặc bảng báo cáo cũ trong các sheet chưa import.

### Vai trò của `DL_SO_QUY`

`DL_SO_QUY` là nguồn chính cho dòng tiền và cảnh báo chi bất thường, nhưng không thay thế các sheet khác.

- Tiền thu/chi, dòng tiền tạm, top khoản chi lớn: lấy trực tiếp từ `DL_SO_QUY`.
- Tiền trả NCC/công nợ: phát hiện từ `DL_SO_QUY`, nhưng phải đối chiếu `DL_CONG_NO` trước khi kết luận.
- Mua NVL/bao bì: phát hiện từ `DL_SO_QUY`, nhưng nên đối chiếu `DL_THU_MUA`, `DL_TON_KHO`, `DL_THAT_THOAT_NVL`.
- Đầu tư/capex: phát hiện từ `DL_SO_QUY`, nhưng không đưa thẳng vào chi phí vận hành/P&L tuần.
- Nhóm `Khác`: phải được kế toán phân loại lại trước khi chốt báo cáo.
