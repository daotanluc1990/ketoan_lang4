# AI Agent Contract — V4.6.2 Gemini Provider

## Trạng thái

Tài liệu này thuộc blueprint đã duyệt cho app **Cơm Tấm Làng — CEO Report Dashboard**.

## Nguyên tắc chung

- UI và Google Sheet dùng tiếng Việt.
- Import phải có kiểm tra trước khi ghi.
- Không ghi đè tự động.
- Không bịa số nếu thiếu dữ liệu.
- Dashboard phải trả lời: tốt/xấu, vì sao, cần làm gì ngay.
- Nếu thiếu dữ liệu, output phải có câu: `Chưa đủ dữ liệu để kết luận.`

## V4.6.2 AI Agent thật

### Endpoint

- `GET/POST /api/ai/report-analysis`
- `GET/POST /api/ai-agent/analyze`

### Env

Provider khuyến nghị cho dự án này là Gemini 2.5 Flash.

- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash`

Giữ OpenAI như provider dự phòng nếu sau này cần đổi:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

### Auth/RBAC

- Chỉ user đã đăng nhập bằng session cookie server-side mới được gọi API AI.
- Role được phép: `CEO`, `Kế toán`.
- Mỗi lần gọi AI phải ghi audit log `AI_REPORT_ANALYSIS` nếu data store ghi được.
- API không nhận role/actor từ client. Actor lấy từ session đăng nhập.

### Rule

- Nếu `AI_PROVIDER=gemini` nhưng thiếu `GEMINI_API_KEY`, API trả phân tích rule-based fallback và ghi rõ chưa gọi AI thật. Nếu `AI_PROVIDER=openai` thì dùng `OPENAI_API_KEY`.
- Không bịa số. Không kết luận gian lận nếu không có bằng chứng.
- Không trả secret, token, private key, sheet id đầy đủ, password hoặc `.env` value.
- Không tự ghi Google Sheet khi chỉ phân tích AI.
- Khi Gemini/OpenAI lỗi hoặc trả sai JSON, hệ thống phải fallback rule-based, không làm hỏng dashboard.

## Chuẩn tạo AI Skill/Agent về sau

Nếu sau này tạo thêm AI Skill hoặc Agent Blueprint trong dự án này, bắt buộc đọc:

1. `AGENTS.md`
2. `docs/SKILL_AGENT_STRUCTURE_GUIDE.md`

Yêu cầu:

- Trước khi tạo/sửa file skill/agent, phải liệt kê `files planned to change` và chờ chủ duyệt.
- Không code app/bot nếu yêu cầu chỉ là tạo skill/agent.
- Không sửa ngoài phạm vi `.agents/skills/`, `docs/AGENT_BLUEPRINTS/`, hoặc tài liệu agent đã được duyệt.
- Mỗi `SKILL.md` phải bắt đầu bằng `---`, có YAML front matter và đủ các phần chuẩn.
- Mỗi Agent Blueprint phải có đủ 14 phần theo `SKILL_AGENT_STRUCTURE_GUIDE.md`.
