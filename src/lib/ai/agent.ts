import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import type { ReportFilter } from '@/lib/reports/report-filters';
import { getServerEnv, hasAiEnv } from '@/lib/env/server-env';

type AiMode = 'real_gemini' | 'real_openai' | 'rule_based_missing_env';

export type AiAgentAnalysis = {
  mode: AiMode;
  conclusion: string;
  rows: Array<{
    mucDo: string;
    vanDe: string;
    bangChung: string;
    nguyenNhanKhaNghi: string;
    viecCanLam: string;
    owner: string;
    deadline: string;
  }>;
  raw?: string;
};

type AiAgentParsedOutput = Omit<AiAgentAnalysis, 'mode' | 'raw'>;

type GeminiInteractionResponse = {
  output_text?: string;
  steps?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function ruleBasedAnalysis(report: Awaited<ReturnType<typeof buildDashboardReport>>, providerLabel = 'AI'): AiAgentAnalysis {
  if ('hasRealData' in report && !report.hasRealData) {
    return {
      mode: 'rule_based_missing_env',
      conclusion: 'Chưa đủ dữ liệu để kết luận. Google Sheet/data store chưa có dữ liệu import thật.',
      rows: [{ mucDo: 'Cảnh báo', vanDe: 'Chưa có dữ liệu thật', bangChung: report.message, nguyenNhanKhaNghi: 'Chưa import hoặc chưa xác nhận ghi Google Sheet.', viecCanLam: 'Import đủ file và kiểm tra các sheet DL_* có dữ liệu từ dòng 4.', owner: 'Kế toán', deadline: 'Hôm nay' }]
    };
  }
  const kpis = 'executiveKpis' in report ? report.executiveKpis : [];
  const warningKpis = kpis.filter((kpi) => kpi.status === 'warning' || kpi.status === 'danger');
  if (!warningKpis.length) {
    return {
      mode: 'rule_based_missing_env',
      conclusion: `Chưa có cấu hình ${providerLabel} hợp lệ nên dùng rule-based. Dữ liệu hiện tại chưa có cảnh báo warning/danger lớn.`,
      rows: [{ mucDo: 'Tốt', vanDe: 'Chưa phát hiện cảnh báo lớn', bangChung: 'Không có KPI warning/danger', nguyenNhanKhaNghi: 'Chưa đủ dữ liệu để kết luận nguyên nhân sâu.', viecCanLam: 'Tiếp tục cập nhật dữ liệu thật.', owner: 'Kế toán', deadline: 'Hôm nay' }]
    };
  }
  return {
    mode: 'rule_based_missing_env',
    conclusion: `Chưa có cấu hình ${providerLabel} hợp lệ nên dùng phân tích rule-based. Không gọi AI thật.`,
    rows: warningKpis.slice(0, 5).map((kpi) => ({
      mucDo: kpi.status === 'danger' ? 'Nguy hiểm' : 'Cảnh báo',
      vanDe: kpi.label,
      bangChung: `${kpi.value} — ${kpi.trend}`,
      nguyenNhanKhaNghi: 'Chưa đủ dữ liệu để kết luận nguyên nhân chắc chắn. Cần đối soát file nguồn.',
      viecCanLam: `Kiểm tra lại chỉ số ${kpi.label} trong báo cáo tuần và file import liên quan.`,
      owner: kpi.label.toLowerCase().includes('thất thoát') ? 'Kế toán + Quản lý cửa hàng' : 'Kế toán',
      deadline: '24h'
    }))
  };
}

function safeJsonFromText(text: string): AiAgentParsedOutput | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as AiAgentParsedOutput;
    if (Array.isArray(parsed.rows) && typeof parsed.conclusion === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

function buildPrompt(report: Awaited<ReturnType<typeof buildDashboardReport>>) {
  return `Bạn là AI Agent CFO/COO cho chuỗi Cơm Tấm Làng.\n\nQuy tắc bắt buộc:\n- Không bịa số.\n- Chỉ dùng dữ liệu JSON được cung cấp.\n- Nếu thiếu dữ liệu, ghi chính xác: Chưa đủ dữ liệu để kết luận.\n- Không kết luận gian lận nếu chưa có bằng chứng.\n- Trả về JSON thuần, không markdown.\n\nSchema output:\n{\n  "conclusion": "...",\n  "rows": [\n    {"mucDo":"Tốt|Cảnh báo|Nguy hiểm", "vanDe":"...", "bangChung":"...", "nguyenNhanKhaNghi":"...", "viecCanLam":"...", "owner":"...", "deadline":"..."}\n  ]\n}\n\nDữ liệu báo cáo:\n${JSON.stringify(report).slice(0, 24000)}`;
}

function extractGeminiText(json: GeminiInteractionResponse) {
  if (typeof json.output_text === 'string') return json.output_text;
  const textParts = json.steps
    ?.flatMap((step) => step.content ?? [])
    .filter((item) => item.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('\n');
  return textParts ?? '';
}

async function callGemini(prompt: string) {
  const env = getServerEnv();
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': env.geminiApiKey ?? ''
    },
    body: JSON.stringify({
      model: env.geminiModel,
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API lỗi ${response.status}: ${text.slice(0, 200)}`);
  }

  const json = (await response.json()) as GeminiInteractionResponse;
  return extractGeminiText(json);
}

async function callOpenAi(prompt: string) {
  const env = getServerEnv();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiModel,
      messages: [
        { role: 'system', content: 'Bạn là AI Agent phân tích báo cáo quản trị F&B. Trả JSON thuần.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API lỗi ${response.status}: ${text.slice(0, 200)}`);
  }

  const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? '';
}

export async function analyzeReportWithAi(filter?: ReportFilter | URLSearchParams | Record<string, string | string[] | undefined>): Promise<AiAgentAnalysis> {
  const report = await buildDashboardReport(filter ?? {});
  const env = getServerEnv();
  const providerLabel = env.aiProvider === 'gemini' ? 'GEMINI_API_KEY' : env.aiProvider === 'openai' ? 'OPENAI_API_KEY' : 'AI_PROVIDER';
  if (!hasAiEnv()) return ruleBasedAnalysis(report, providerLabel);

  const prompt = buildPrompt(report);

  try {
    const content = env.aiProvider === 'openai' ? await callOpenAi(prompt) : await callGemini(prompt);
    const parsed = safeJsonFromText(content);
    if (!parsed) {
      return { ...ruleBasedAnalysis(report, providerLabel), conclusion: 'AI trả về format không hợp lệ, dùng rule-based fallback.', raw: content.slice(0, 500) };
    }
    return { mode: env.aiProvider === 'openai' ? 'real_openai' : 'real_gemini', ...parsed, raw: content.slice(0, 500) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không rõ lỗi';
    return { ...ruleBasedAnalysis(report, providerLabel), conclusion: `AI API lỗi, dùng rule-based fallback. Lỗi: ${message}` };
  }
}
