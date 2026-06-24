# QA Report — V4.6.2 Gemini Provider

## Tình hình chung

Đạt ở mức **Vercel Preview/Staging Candidate**.

Bản này đổi AI Agent mặc định từ OpenAI sang **Gemini 2.5 Flash** qua REST Interactions API, giữ OpenAI như provider dự phòng, và vẫn fallback rule-based nếu thiếu key hoặc AI trả lỗi.

## Thay đổi chính

- Thêm biến môi trường:
  - `AI_PROVIDER=gemini`
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL=gemini-2.5-flash`
- Giữ biến OpenAI dự phòng:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
- `src/lib/ai/agent.ts` gọi Gemini qua `https://generativelanguage.googleapis.com/v1beta/interactions`.
- AI output vẫn bắt buộc JSON thuần theo schema cũ.
- Nếu Gemini/OpenAI lỗi, thiếu key, hoặc trả sai JSON: dùng rule-based fallback, không làm hỏng dashboard.
- Cập nhật UI Cài đặt & Bot từ “OpenAI” thành “AI Agent”.
- Cập nhật docs Vercel Env, AI contract, README và UAT checklist.
- Không thêm dependency mới để giảm rủi ro deploy.

## Commands đã chạy

| Command | Result | Notes |
|---|---:|---|
| `npm install` | PASS | Cài dependency thành công |
| `npm run typecheck` | PASS | TypeScript pass |
| `npm run lint` | PASS | ESLint pass, max warnings = 0 |
| `npm run test` | PASS | 4 test files / 7 tests passed |
| `npm run build` | PASS | Next.js build pass |
| `npm run static-ui-qa` | PASS | 9 tabs + layout checks pass |
| `npm audit --omit=dev` | Cảnh báo | 7 production vulnerabilities: 6 moderate, 1 high |

## Test AI

Đã test bằng unit test mock:

- Thiếu `GEMINI_API_KEY` → `mode: rule_based_missing_env`.
- Có `AI_PROVIDER=gemini` + `GEMINI_API_KEY` giả + mock Gemini response → parse JSON thành công, `mode: real_gemini`.

Chưa test gọi Gemini thật vì chưa có `GEMINI_API_KEY` thật trong môi trường này.

## Secret safety

- Không thêm `.env` thật.
- Không thêm Gemini key, OpenAI key, Telegram token, Google private key hoặc password thật.
- `package-lock.json` đã dùng public npm registry URL, không giữ registry nội bộ sandbox.

## Vercel Env cần dùng

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=<Gemini API key thật>
GEMINI_MODEL=gemini-2.5-flash
```

Không cần nhập `OPENAI_API_KEY` nếu anh dùng Gemini.

## Rủi ro còn lại

1. Chưa test Gemini thật trên Vercel vì chưa có key thật.
2. `xlsx` vẫn có cảnh báo high và chưa có fix trong npm audit; chỉ upload file Excel nội bộ tin cậy.
3. `next`/`postcss` audit warning còn tồn tại trong dependency tree hiện tại; không dùng `npm audit fix --force` vì có thể downgrade/break Next.
4. Production-live vẫn cần Vercel Preview UAT với Google Sheet thật và tài khoản CEO/Kế toán.

## Kết luận

Bản V4.6.2 đủ điều kiện đưa lên Vercel Preview để test Gemini thật sau khi cấu hình env.
