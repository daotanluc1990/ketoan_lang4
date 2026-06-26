# Report Cache / Snapshot

App hiện dùng memory snapshot cache mặc định. Không cần cấu hình thêm Vercel KV, Upstash Redis, hoặc tạo sheet lịch sử snapshot để app chạy nhanh hơn bản cũ.

## Mặc định đang dùng

```text
Memory cache trong app
TTL mặc định: 900 giây
```

Ý nghĩa:

- Không cần thêm biến môi trường.
- Không cần tạo thêm sheet trong Google Sheet.
- Nút `Làm mới báo cáo` sẽ làm ấm lại cache trong phiên server hiện tại.
- Nếu Vercel cold start hoặc đổi server/lambda, cache có thể mất và app sẽ đọc Google Sheet lại lần đầu.

## Tùy chọn sau này: External cache

Chỉ cấu hình khi cần cache bền hơn qua nhiều Vercel instance.

### Vercel KV

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

### Upstash Redis

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Nếu không cấu hình các biến trên, app vẫn chạy bình thường bằng memory cache.

## Cache TTL

Có thể chỉnh bằng biến tùy chọn:

```text
REPORT_SNAPSHOT_TTL_SECONDS
```

Nếu không cấu hình, app dùng mặc định `900` giây.

## API làm mới cache

Endpoint:

```text
POST /api/reports/prewarm
```

Endpoint này yêu cầu đăng nhập role `CEO` hoặc `Kế toán`.

## Snapshot history

Không còn bắt buộc tạo sheet `REPORT_SNAPSHOT_HISTORY`.

Nếu sau này muốn lưu lịch sử snapshot để truy vết kế toán, cần thiết kế lại như một tính năng riêng, có phân quyền, dung lượng lưu, thời gian lưu và cách đọc lại lịch sử.
