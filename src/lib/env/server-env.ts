import { z } from 'zod';

const rawEnvSchema = z.object({
  DATA_STORE: z.enum(['local', 'google_sheets']).optional(),
  GOOGLE_SHEET_ID: z.string().optional(),
  GOOGLE_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),

  AI_PROVIDER: z.enum(['gemini', 'openai', 'none']).optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  AUTH_ENABLED: z.string().optional(),
  AUTH_SESSION_SECRET: z.string().optional(),
  AUTH_SESSION_MAX_AGE_HOURS: z.string().optional(),
  AUTH_CEO_USERNAME: z.string().optional(),
  AUTH_CEO_PASSWORD: z.string().optional(),
  AUTH_CEO_NAME: z.string().optional(),
  AUTH_ACCOUNTANT_USERNAME: z.string().optional(),
  AUTH_ACCOUNTANT_PASSWORD: z.string().optional(),
  AUTH_ACCOUNTANT_NAME: z.string().optional(),

  // Legacy V4.5.1 basic-auth variables. Kept for backward compatibility in docs/check endpoint only.
  APP_USERNAME: z.string().optional(),
  APP_PASSWORD: z.string().optional(),
  APP_BASIC_AUTH_ENABLED: z.string().optional()
});

export type EnvCheck = {
  name: string;
  configured: boolean;
  requiredFor: string;
};

export type AiProvider = 'gemini' | 'openai' | 'none';

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function selectAiProvider(env: z.infer<typeof rawEnvSchema>): AiProvider {
  if (env.AI_PROVIDER) return env.AI_PROVIDER;
  if (env.GEMINI_API_KEY) return 'gemini';
  if (env.OPENAI_API_KEY) return 'openai';
  return 'gemini';
}

export function getServerEnv() {
  const env = rawEnvSchema.parse(process.env);
  const aiProvider = selectAiProvider(env);
  return {
    dataStore: env.DATA_STORE ?? 'local',
    googleSheetId: env.GOOGLE_SHEET_ID,
    googleClientEmail: env.GOOGLE_CLIENT_EMAIL,
    googlePrivateKey: normalizePrivateKey(env.GOOGLE_PRIVATE_KEY),

    aiProvider,
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    openAiApiKey: env.OPENAI_API_KEY,
    openAiModel: env.OPENAI_MODEL ?? 'gpt-4.1-mini',

    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    telegramChatId: env.TELEGRAM_CHAT_ID,

    authEnabled: env.AUTH_ENABLED !== 'false',
    authSessionSecret: env.AUTH_SESSION_SECRET,
    authSessionMaxAgeHours: parsePositiveInteger(env.AUTH_SESSION_MAX_AGE_HOURS, 12),
    authCeoUsername: env.AUTH_CEO_USERNAME,
    authCeoPassword: env.AUTH_CEO_PASSWORD,
    authCeoName: env.AUTH_CEO_NAME ?? 'CEO',
    authAccountantUsername: env.AUTH_ACCOUNTANT_USERNAME,
    authAccountantPassword: env.AUTH_ACCOUNTANT_PASSWORD,
    authAccountantName: env.AUTH_ACCOUNTANT_NAME ?? 'Kế toán',

    appUsername: env.APP_USERNAME,
    appPassword: env.APP_PASSWORD,
    basicAuthEnabled: env.APP_BASIC_AUTH_ENABLED === 'true'
  };
}

export function normalizePrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

export function getEnvChecklist(): EnvCheck[] {
  const env = getServerEnv();
  return [
    { name: 'DATA_STORE', configured: env.dataStore === 'google_sheets' || env.dataStore === 'local', requiredFor: 'Chọn local hoặc Google Sheets' },
    { name: 'GOOGLE_SHEET_ID', configured: Boolean(env.googleSheetId), requiredFor: 'Đọc/ghi Google Sheet thật' },
    { name: 'GOOGLE_CLIENT_EMAIL', configured: Boolean(env.googleClientEmail), requiredFor: 'Google service account' },
    { name: 'GOOGLE_PRIVATE_KEY', configured: Boolean(env.googlePrivateKey), requiredFor: 'Google service account' },
    { name: 'AUTH_ENABLED', configured: env.authEnabled, requiredFor: 'Bật đăng nhập thật cho Vercel staging/production' },
    { name: 'AUTH_SESSION_SECRET', configured: Boolean(env.authSessionSecret), requiredFor: 'Ký session cookie server-side' },
    { name: 'AUTH_CEO_USERNAME', configured: Boolean(env.authCeoUsername), requiredFor: 'Tài khoản CEO' },
    { name: 'AUTH_CEO_PASSWORD', configured: Boolean(env.authCeoPassword), requiredFor: 'Mật khẩu CEO trong Vercel Env' },
    { name: 'AUTH_ACCOUNTANT_USERNAME', configured: Boolean(env.authAccountantUsername), requiredFor: 'Tài khoản Kế toán' },
    { name: 'AUTH_ACCOUNTANT_PASSWORD', configured: Boolean(env.authAccountantPassword), requiredFor: 'Mật khẩu Kế toán trong Vercel Env' },
    { name: 'AI_PROVIDER', configured: env.aiProvider !== 'none', requiredFor: 'Chọn gemini/openai/none cho AI Agent' },
    { name: 'GEMINI_API_KEY', configured: Boolean(env.geminiApiKey), requiredFor: 'AI Agent thật nếu AI_PROVIDER=gemini' },
    { name: 'GEMINI_MODEL', configured: Boolean(env.geminiModel), requiredFor: 'Model Gemini, mặc định gemini-2.5-flash' },
    { name: 'OPENAI_API_KEY', configured: Boolean(env.openAiApiKey), requiredFor: 'AI Agent thật nếu AI_PROVIDER=openai' },
    { name: 'OPENAI_MODEL', configured: Boolean(env.openAiModel), requiredFor: 'Model OpenAI dự phòng' },
    { name: 'TELEGRAM_BOT_TOKEN', configured: Boolean(env.telegramBotToken), requiredFor: 'Gửi Telegram thật' },
    { name: 'TELEGRAM_CHAT_ID', configured: Boolean(env.telegramChatId), requiredFor: 'Gửi Telegram thật' }
  ];
}

export function hasGoogleSheetsEnv() {
  const env = getServerEnv();
  return Boolean(env.googleSheetId && env.googleClientEmail && env.googlePrivateKey);
}

export function hasGeminiEnv() {
  return Boolean(getServerEnv().geminiApiKey);
}

export function hasOpenAiEnv() {
  return Boolean(getServerEnv().openAiApiKey);
}

export function hasAiEnv() {
  const env = getServerEnv();
  if (env.aiProvider === 'none') return false;
  if (env.aiProvider === 'gemini') return Boolean(env.geminiApiKey);
  if (env.aiProvider === 'openai') return Boolean(env.openAiApiKey);
  return false;
}

export function hasTelegramEnv() {
  const env = getServerEnv();
  return Boolean(env.telegramBotToken && env.telegramChatId);
}

export function hasAuthEnv() {
  const env = getServerEnv();
  if (!env.authEnabled) return true;
  return Boolean(
    env.authSessionSecret &&
    env.authCeoUsername &&
    env.authCeoPassword &&
    env.authAccountantUsername &&
    env.authAccountantPassword
  );
}
