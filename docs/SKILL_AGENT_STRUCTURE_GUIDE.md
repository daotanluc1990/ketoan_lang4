# HƯỚNG DẪN TẠO SKILLS VÀ AGENT

> Tài liệu chuẩn nội bộ: nếu dự án tạo thêm AI Skill hoặc Agent Blueprint, Codex/AI phải đọc `AGENTS.md` và file này trước khi lập kế hoạch. Không tạo/sửa skill/agent ngoài phạm vi đã được duyệt.


## 1. Lưu file vào đâu?

Trong project của anh, tạo file này:
G:\CƠM TẤM LÀNG\04_PROJECTS\training\docs\SKILL_AGENT_STRUCTURE_GUIDE.md
Nội dung là toàn bộ tài liệu “Chuẩn cấu trúc Skill & Agent” tôi đã viết ở trên.
Cấu trúc nên có:
training/
├── AGENTS.md
├── docs/
│   ├── SKILL_AGENT_STRUCTURE_GUIDE.md
│   ├── AGENT_MAP.md
│   ├── AGENT_SEQUENCE.md
│   ├── AGENT_TOOL_MAP.md
│   ├── AGENT_MEMORY_MAP.md
│   ├── AGENT_EVALUATION.md
│   └── AGENT_BLUEPRINTS/
│
└── .agents/
└── skills/

## 2. Khi nào dùng file này?

Dùng khi anh muốn Codex làm 1 trong 4 việc:

## 1. Tạo skill mới


## 2. Tạo agent mới


## 3. Kiểm tra skill/agent đã đúng chuẩn chưa


## 4. Chuẩn hóa lại toàn bộ hệ thống agent trong project

Ví dụ:
Tôi muốn tạo skill phân tích đào tạo nhân viên.
Tôi muốn tạo agent Daily Evaluation Agent.
Tôi muốn kiểm tra toàn bộ skill có đúng chuẩn YAML front matter không.
Tôi muốn tạo Agent Map và Agent Sequence cho HR/Training.

## 3. Cách dùng nhanh nhất trong Codex

Mỗi lần làm, anh mở Codex trong đúng folder project:
cd "G:\CƠM TẤM LÀNG\04_PROJECTS\training"
Sau đó dùng prompt mẫu này:
Đọc AGENTS.md trước.
Đọc thêm docs/SKILL_AGENT_STRUCTURE_GUIDE.md.
Yêu cầu:
[Tôi muốn tạo skill/agent gì]
Hãy làm đúng cấu trúc trong SKILL_AGENT_STRUCTURE_GUIDE.md.
Trước khi tạo/sửa file, liệt kê files planned to change và chờ tôi OK.
Không code app/bot nếu tôi chưa yêu cầu.
Không sửa ngoài phạm vi skill/docs/agent blueprint.

## 4. Dùng để tạo Skill mới

Ví dụ anh muốn tạo skill phân tích đào tạo:
Đọc AGENTS.md trước.
Đọc docs/SKILL_AGENT_STRUCTURE_GUIDE.md.
Yêu cầu:
Tạo một Codex Skill mới.
Tên skill:
hr-training-analysis-agent
Mục tiêu:
Phân tích ghi nhận đào tạo hằng ngày và tổng hợp theo giai đoạn 3/7/14/30 ngày để AI đề xuất cảnh báo, kế hoạch đào tạo, theo dõi và quyết định.
Tạo file:
.agents/skills/hr-training-analysis-agent/SKILL.md
Yêu cầu:
- Làm đúng template “Cấu trúc chuẩn của một Skill” trong docs/SKILL_AGENT_STRUCTURE_GUIDE.md.
- Dòng đầu tiên phải là ---
- Metadata nằm trong YAML front matter.
- Có name, description, version, category, tags.
- Có Purpose, When to Use, Inputs, Procedure, Mandatory Rules, Output Format, Quality Criteria, Verification, Edge Cases, Examples, Definition of Done, Changelog.
Trước khi tạo file, liệt kê files planned to change và chờ tôi OK.
Khi Codex trả lời đúng file sẽ tạo, anh mới nhắn:
OK, tạo file đúng phạm vi đã liệt kê.

## 5. Dùng để tạo Agent mới

Ví dụ tạo Daily Evaluation Agent:
Đọc AGENTS.md trước.
Đọc docs/SKILL_AGENT_STRUCTURE_GUIDE.md.
Yêu cầu:
Tạo blueprint cho Agent mới.
Tên agent:
Daily Evaluation Agent
Agent này thuộc hệ:
HR/Training Agent System
Mục tiêu:
Theo dõi ghi nhận đánh giá hằng ngày của trưởng ca, phát hiện nhân viên chưa được đánh giá, lỗi lặp lại, vi phạm đã đào tạo và cảnh báo sớm.
Tạo file:
docs/AGENT_BLUEPRINTS/02_daily_evaluation_agent.md
Yêu cầu:
Làm đúng template “Cấu trúc chuẩn của một Agent Blueprint” trong docs/SKILL_AGENT_STRUCTURE_GUIDE.md.
Blueprint phải có đủ:

## 1. Mission / Mục tiêu


## 2. Role / System Prompt


## 3. Users / Người dùng phục vụ


## 4. Scope


## 5. Inputs


## 6. Tools / Integrations


## 7. Memory / Knowledge


## 8. LLM Strategy


## 9. Sequence / Orchestration


## 10. RBAC / Permission Rules


## 11. Output Format


## 12. Testing / Evaluation


## 13. Anti-error Rules


## 14. Definition of Done

Trước khi tạo file, liệt kê files planned to change và chờ tôi OK.
Không code.
Không sửa app/bot logic.

## 6. Dùng để kiểm tra skill/agent đã đúng chuẩn chưa

Sau khi Codex tạo xong, dùng prompt kiểm tra:
Đọc AGENTS.md trước.
Đọc docs/SKILL_AGENT_STRUCTURE_GUIDE.md.
Yêu cầu:
Kiểm tra toàn bộ cấu trúc skills và agents trong project.
Không sửa file.
Kiểm tra:

## 1. Mỗi skill có nằm đúng .agents/skills/<skill-name>/SKILL.md không?


## 2. Mỗi SKILL.md có dòng đầu tiên là --- không?


## 3. Metadata có nằm trong YAML front matter không?


## 4. Có name và description không?


## 5. Description có nói rõ khi nào dùng skill không?


## 6. Có đủ Purpose, When to Use, Inputs, Procedure, Mandatory Rules, Output Format, Quality Criteria không?


## 7. Mỗi agent blueprint có nằm trong docs/AGENT_BLUEPRINTS/ không?


## 8. Mỗi agent có đủ 14 phần blueprint không?


## 9. Có AGENT_MAP.md không?


## 10. Có AGENT_SEQUENCE.md không?


## 11. Có AGENT_TOOL_MAP.md không?


## 12. Có AGENT_MEMORY_MAP.md không?


## 13. Có AGENT_EVALUATION.md không?

Trả về:
- Đạt / Chưa đạt
- File lỗi
- Lỗi cụ thể
- Cách sửa đề xuất
- Không sửa nếu tôi chưa OK

## 7. Quy trình sử dụng chuẩn

Đi theo đúng thứ tự này:
Bước 1: Lưu file hướng dẫn vào docs/SKILL_AGENT_STRUCTURE_GUIDE.md
Bước 2: Bảo Codex đọc AGENTS.md + file hướng dẫn
Bước 3: Yêu cầu tạo skill hoặc agent
Bước 4: Bắt Codex liệt kê files planned to change
Bước 5: Anh OK
Bước 6: Codex tạo file
Bước 7: Chạy prompt kiểm tra chuẩn
Bước 8: Nếu lỗi, yêu cầu sửa đúng lỗi, không sửa lan man

## 8. Lỗi cần tránh

Đừng bảo Codex:
Tạo hết toàn bộ hệ thống agent luôn.
Nên chia nhỏ:
Hôm nay tạo 1 skill.
Xong kiểm tra.
Sau đó tạo 1 agent.
Xong kiểm tra.
Sau đó mới tạo Agent Map / Sequence.
Cách này chậm hơn chút nhưng ít lỗi, ít loạn.

## 9. Với dự án HR/Training hiện tại, nên dùng ngay thế nào?

Thứ tự tốt nhất:

## 1. Tạo skill hr-training-analysis-agent


## 2. Tạo blueprint HR/Training Orchestrator Agent


## 3. Tạo blueprint Daily Evaluation Agent


## 4. Tạo blueprint Competency Assessment Agent


## 5. Tạo blueprint HR Decision Agent


## 6. Tạo blueprint Reporting Agent


## 7. Tạo AGENT_MAP.md


## 8. Tạo AGENT_SEQUENCE.md


## 9. Tạo AGENT_TOOL_MAP.md


## 10. Tạo AGENT_EVALUATION.md

Tóm lại: file này là “quy chuẩn nội bộ” để Codex tạo skill/agent đúng format. Anh không dùng nó để chạy app; anh dùng nó để bắt Codex tạo mọi skill/agent sau này theo cùng một chuẩn.
