import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeReportWithAi } from '../agent';

const oldEnv = { ...process.env };

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...oldEnv };
});

describe('analyzeReportWithAi', () => {
  it('falls back to rule-based analysis when Gemini/OpenAI API keys are missing', async () => {
    process.env.AI_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await analyzeReportWithAi();
    expect(result.mode).toBe('rule_based_missing_env');
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('uses Gemini provider and parses JSON output when GEMINI_API_KEY is configured', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        steps: [
          {
            type: 'model_output',
            content: [
              {
                type: 'text',
                text: '{"conclusion":"Gemini OK","rows":[{"mucDo":"Tốt","vanDe":"Test","bangChung":"Mock","nguyenNhanKhaNghi":"Mock","viecCanLam":"Mock","owner":"Kế toán","deadline":"Hôm nay"}]}'
              }
            ]
          }
        ]
      })
    } as Response);

    const result = await analyzeReportWithAi();

    expect(fetchMock).toHaveBeenCalledWith('https://generativelanguage.googleapis.com/v1beta/interactions', expect.objectContaining({ method: 'POST' }));
    expect(result.mode).toBe('real_gemini');
    expect(result.conclusion).toBe('Gemini OK');
    expect(result.rows[0]?.owner).toBe('Kế toán');
  });
});
