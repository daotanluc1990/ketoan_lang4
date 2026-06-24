export type Status = 'good' | 'warning' | 'danger' | 'neutral';
export type Role = 'CEO' | 'Kế toán' | 'Admin' | 'Quản lý cửa hàng';

export const reportMeta = {
  branch: 'Làng NVT',
  weekLabel: 'Tuần 01/06/2026 – 07/06/2026',
  createdBy: 'Kế toán',
  reportDay: 'Thứ 2',
  dataQuality: 'Cảnh báo',
  note: 'Dữ liệu mẫu để duyệt UI. Chưa kết nối Google Sheet thật.'
};

export const executiveKpis = [
  { label: 'Tổng doanh thu', value: '223,6tr', hint: 'App net + cửa hàng thực', trend: '↓ 4,8% so với tuần trước', status: 'warning' as Status },
  { label: 'Tiền đã về', value: '187,2tr', hint: 'Tiền mặt + CK + app đã về', trend: 'Đạt 83,7% doanh thu', status: 'good' as Status },
  { label: 'App chưa về', value: '36,4tr', hint: 'Tiền còn treo cần đối soát', trend: 'Vượt ngưỡng +6,4tr', status: 'warning' as Status },
  { label: 'COGS%', value: '43,8%', hint: 'Giá vốn / doanh thu', trend: 'Vượt ngưỡng +1,8 điểm %', status: 'warning' as Status },
  { label: 'Labor%', value: '18,5%', hint: 'Chi phí lao động / doanh thu', trend: 'Vượt ngưỡng +2,5 điểm %', status: 'danger' as Status },
  { label: 'Dòng tiền cuối tuần', value: '117,4tr', hint: 'Theo sổ quỹ cuối kỳ', trend: 'Đủ an toàn tuần này', status: 'good' as Status },
  { label: 'Thất thoát quy tiền', value: '3,82tr', hint: 'Tóm tắt từ file thất thoát', trend: 'Vượt định mức +1,15tr', status: 'warning' as Status },
  { label: 'Data Quality', value: '82/100', hint: 'Còn cảnh báo đối soát', trend: 'Thiếu công nợ NCC chi tiết', status: 'warning' as Status }
];

export const revenueByChannel = [
  { channel: 'Grab', revenue: '77,2tr', orders: '1.054', status: 'good' as Status },
  { channel: 'Cửa hàng', revenue: '100,9tr', orders: '5.525 phần', status: 'good' as Status },
  { channel: 'ShopeeFood', revenue: '37,8tr', orders: '538', status: 'warning' as Status },
  { channel: 'BeFood', revenue: '4,9tr', orders: '73', status: 'neutral' as Status },
  { channel: 'Xanh', revenue: '2,8tr', orders: '35', status: 'neutral' as Status }
];

export const issueRows = [
  ['1', 'Labor% vượt ngưỡng', 'Ảnh hưởng biên lợi nhuận', 'Tăng giờ công/ca chưa tối ưu', 'Rà lại lịch ca và doanh thu/giờ công'],
  ['2', 'App chưa về cao', '36,4tr còn treo', 'Chưa đối soát kỳ chuyển tiền', 'Kế toán đối soát app trước 16:00'],
  ['3', 'COGS% vượt ngưỡng', '43,8%', 'Giá NVL/tỷ lệ hao hụt tăng', 'Kiểm tra top 5 NVL thất thoát'],
  ['4', 'Thiếu công nợ NCC chi tiết', 'Data Quality chỉ 82/100', 'Chưa nhập đủ bảng công nợ', 'Bổ sung trước khi chốt báo cáo'],
  ['5', 'Dự toán tuần tới cảnh báo', 'Dự kiến chi 151,2tr', 'NCC đến hạn + mua NVL', 'CEO duyệt khoản chi ưu tiên']
];

export const approvalRows = [
  ['Thanh toán NCC thịt', '42,0tr', 'Đến hạn trong tuần', 'Thứ 3', 'Duyệt một phần 30tr trước'],
  ['Mua bao bì dự phòng', '8,5tr', 'Tồn dưới min', 'Thứ 4', 'Duyệt nếu doanh thu app về đúng hạn'],
  ['Sửa bếp nướng', '3,2tr', 'Ảnh hưởng cao điểm sáng', 'Hôm nay', 'Duyệt ngay'],
  ['Chi marketing app', '5,0tr', 'ShopeeFood giảm đơn', 'Thứ 5', 'Chờ phân tích hiệu quả']
];

export const pnlRows = [
  ['Doanh thu', 'Tổng doanh thu', '223,6tr', '234,9tr', '-4,8%', '100%', 'Cảnh báo'],
  ['Doanh thu', 'Cửa hàng', '100,9tr', '108,4tr', '-6,9%', '45,1%', 'Cảnh báo'],
  ['Doanh thu', 'App food net', '122,7tr', '126,5tr', '-3,0%', '54,9%', 'Tốt'],
  ['Giá vốn', 'Nguyên liệu + bao bì', '97,9tr', '96,2tr', '+1,8%', '43,8%', 'Cảnh báo'],
  ['Giá vốn', 'Thất thoát NVL theo file riêng', '3,82tr', '2,54tr', '+50,4%', '1,7%', 'Cảnh báo'],
  ['Lãi gộp', 'Gross Profit', '121,9tr', '136,1tr', '-10,4%', '54,5%', 'Cảnh báo'],
  ['Chi phí', 'Chi phí lao động', '41,4tr', '38,7tr', '+7,0%', '18,5%', 'Nguy hiểm'],
  ['Chi phí', 'Mặt bằng', '5,0tr', '5,0tr', '0%', '2,2%', 'Tốt'],
  ['Chi phí', 'Điện/nước/gas', '4,8tr', '4,3tr', '+11,6%', '2,1%', 'Cảnh báo'],
  ['Lợi nhuận', 'Lợi nhuận vận hành tạm tính', '68,2tr', '82,1tr', '-16,9%', '30,5%', 'Cảnh báo']
];

export const cashflowRows = [
  ['Tiền đầu tuần', 'Tiền mặt + ngân hàng', '1,56tr', 'Đã đối chiếu', 'Từ sổ quỹ'],
  ['Tiền vào', 'Tiền mặt', '48,6tr', 'Đã đối chiếu', 'Cửa hàng'],
  ['Tiền vào', 'MoMo/CK', '52,3tr', 'Đã đối chiếu', 'Cửa hàng'],
  ['Tiền vào', 'App đã về', '126,5tr', 'Cần đối chiếu', 'Theo kỳ chuyển tiền'],
  ['Tiền ra', 'Mua hàng/NCC', '69,2tr', 'Đã ghi nhận', 'Sổ quỹ'],
  ['Tiền ra', 'Lương/tạm ứng', '24,6tr', 'Cần kiểm', 'Bảng công/lương'],
  ['Tiền ra', 'Vận hành/sửa chữa', '17,8tr', 'Đã ghi nhận', 'Điện/nước/gas/sửa chữa'],
  ['Treo', 'App chưa về', '36,4tr', 'Cảnh báo', 'Cần đối soát'],
  ['Cần chi', 'Công nợ đến hạn', '42,0tr', 'Cần CEO duyệt', 'NCC thịt']
];

export const balanceRows = [
  ['Tài sản ngắn hạn', 'Tiền mặt cửa hàng', '12,4tr', '9,8tr', '+2,6tr', 'Ổn'],
  ['Tài sản ngắn hạn', 'Tiền ngân hàng', '105,0tr', '91,2tr', '+13,8tr', 'Ổn'],
  ['Tài sản ngắn hạn', 'App chưa về', '36,4tr', '28,1tr', '+8,3tr', 'Cảnh báo'],
  ['Tài sản ngắn hạn', 'Tồn kho cửa hàng', '63,8tr', '58,4tr', '+5,4tr', 'Cần kiểm tồn âm'],
  ['Tài sản vận hành', 'Thiết bị/dụng cụ', '142,0tr', '142,0tr', '0', 'Theo dõi tháng'],
  ['Tài sản vận hành', 'Cọc mặt bằng', '40,0tr', '40,0tr', '0', 'Theo hợp đồng'],
  ['Nợ phải trả', 'Nợ NCC', '42,0tr', '35,4tr', '+6,6tr', 'Cần duyệt'],
  ['Nợ phải trả', 'Lương chưa trả', '18,6tr', '16,1tr', '+2,5tr', 'Cần kiểm'],
  ['Vốn chủ', 'Góp/rút vốn', '—', '—', '—', 'Theo báo cáo tháng']
];

export const forecastRevenueRows = [
  ['Offline', '100,9tr', '106,0tr', '+5,1%', 'Cuối tuần dự kiến đông hơn'],
  ['Grab', '77,2tr', '81,0tr', '+4,9%', 'Giữ ngân sách hiển thị'],
  ['ShopeeFood', '37,8tr', '36,0tr', '-4,8%', 'Đơn giảm, cần kiểm app fee'],
  ['BeFood/Xanh', '7,7tr', '8,5tr', '+10,4%', 'Kênh nhỏ, tăng nhẹ'],
  ['Khác', '0', '1,5tr', '—', 'Khách quen/đặt trước']
];

export const forecastCostRows = [
  ['Mua hàng/NVL', '69,2tr', '74,0tr', 'Có', 'Tồn một số mặt hàng dưới min'],
  ['Lương', '41,4tr', '39,0tr', 'Không', 'Cần tối ưu ca'],
  ['NCC đến hạn', '42,0tr', '42,0tr', 'Có', 'Duyệt thanh toán'],
  ['Điện/nước/gas', '4,8tr', '5,0tr', 'Không', 'Theo định kỳ'],
  ['Sửa chữa/bảo trì', '3,2tr', '3,2tr', 'Có', 'Bếp nướng'],
  ['Marketing', '5,0tr', '5,0tr', 'Chờ', 'Chỉ duyệt nếu có mục tiêu rõ']
];

export const lossTop5Rows = [
  ['Sườn cốt lết', 'kg', '8,2', '1,72tr', '3,8%', '2,0%', '+1,8 điểm %', 'Nguy hiểm', 'Kiểm kê + đối chiếu nướng'],
  ['Đồ chua', 'kg', '12,5', '0,64tr', '5,1%', '3,0%', '+2,1 điểm %', 'Cảnh báo', 'Kiểm tra định mức'],
  ['Mỡ hành', 'kg', '2,1', '0,38tr', '4,4%', '2,5%', '+1,9 điểm %', 'Cảnh báo', 'Đối chiếu nhập/xuất'],
  ['Bao bì hộp', 'cái', '180', '0,31tr', '2,8%', '2,0%', '+0,8 điểm %', 'Cảnh báo', 'Kiểm tra đóng gói app'],
  ['Gạo', 'kg', '6,4', '0,27tr', '1,4%', '1,5%', '-0,1 điểm %', 'Tốt', 'Theo dõi']
];

export const accountingChecklistRows = [
  ['Upload doanh thu app', 'Đã xong', 'Kế toán', 'Thứ 2 08:30', 'Xem file'],
  ['Upload doanh thu cửa hàng', 'Đã xong', 'Kế toán', 'Thứ 2 08:30', 'Xem file'],
  ['Upload sổ quỹ', 'Cảnh báo', 'Kế toán', 'Thứ 2 09:00', 'Đối soát'],
  ['Upload tồn kho', 'Có lỗi', 'Kế toán', 'Thứ 2 09:15', 'Kiểm tra tồn âm'],
  ['Nhập tóm tắt thất thoát', 'Chưa đủ dữ liệu', 'Kế toán', 'Thứ 2 09:30', 'Bổ sung'],
  ['Lập dự toán tuần tới', 'Đang làm', 'Kế toán', 'Thứ 2 10:00', 'Mở dự toán'],
  ['Chốt báo cáo CEO', 'Chưa thể chốt', 'Kế toán trưởng', 'Thứ 2 10:30', 'Khóa khi đủ dữ liệu']
];

export const batchFilesRows = [
  ['Tong_Hop_Doanh_Thu.xlsx', 'Doanh thu app', 'Tuần 23', 'NVT', '42', '0', '0', '0', 'Đạt'],
  ['báo cáo doanh thu tại cửa hàng.xlsx', 'Doanh thu cửa hàng', 'Tuần 23', 'NVT', '14', '0', '0', '0', 'Đạt'],
  ['SoQuy.xlsx', 'Sổ quỹ', 'Tuần 23', 'NVT', '226', '3', '1', '0', 'Cần đối chiếu'],
  ['DanhSachKhoHang.xlsx', 'Tồn kho', 'Tuần 23', 'NVT', '123', '0', '13', '2', 'Có lỗi'],
  ['BÁO CÁO THẤT THOÁT NVL TUẦN.xlsx', 'Thất thoát NVL', 'Tuần 23', 'NVT', '58', '0', '4', '0', 'Cảnh báo']
];

export const importHistoryRows = [
  ['08:12', 'Kế toán', 'Upload batch 5 file', 'Cảnh báo: tồn kho có lỗi'],
  ['08:20', 'Kế toán', 'Đối soát sổ quỹ', '3 dòng trùng được bỏ qua'],
  ['08:35', 'Admin', 'Cập nhật ngưỡng COGS%', 'Không ghi secret'],
  ['09:02', 'Kế toán trưởng', 'Chờ chốt báo cáo', 'Thiếu công nợ NCC chi tiết']
];

export const permissionRows = [
  ['CEO', 'Xem tất cả, duyệt khoản chi, xem báo cáo đã chốt', 'Không nhập dữ liệu thường ngày'],
  ['Kế toán', 'Nhập/import, sửa dữ liệu nháp, chuẩn bị báo cáo', 'Không chỉnh ngưỡng hệ thống'],
  ['Admin', 'Cấu hình ngưỡng, mapping, bot, phân quyền', 'Không thay số liệu báo cáo nếu không có quyền'],
  ['Quản lý cửa hàng', 'Xem phần liên quan, bổ sung ghi chú', 'Không xem thông tin nhạy cảm ngoài phạm vi']
];
