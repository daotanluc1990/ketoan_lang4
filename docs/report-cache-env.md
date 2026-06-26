# Report Cache / Snapshot Environment

Để cache báo cáo bền trên Vercel, cấu hình một trong hai nhóm biến môi trường sau.

## Vercel KV

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## Upstash Redis

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Cache TTL

- `REPORT_SNAPSHOT_TTL_SECONDS`
- Mặc định trong code: `900` giây.

## API làm mới cache

Endpoint:

```text
POST /api/reports/prewarm
```

Endpoint này yêu cầu đăng nhập role `CEO` hoặc `Kế toán`.

## Lưu snapshot dài hạn

Khi bấm làm mới cache, app sẽ cố ghi thêm một bản vào sheet:

```text
REPORT_SNAPSHOT_HISTORY
```

Sheet này cần có header:

```text
Thời gian | Tên báo cáo | Nội dung JSON
```

Nếu sheet chưa tồn tại, app vẫn chạy bình thường nhưng trường `archived` trong kết quả refresh sẽ là `false`.
