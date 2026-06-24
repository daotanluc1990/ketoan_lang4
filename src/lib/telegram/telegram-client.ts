import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { analyzeReportWithAi } from '@/lib/ai/agent';
import { getServerEnv, hasTelegramEnv } from '@/lib/env/server-env';

function stripHtml(text: unknown) {
  return String(text ?? '').replace(/[<>&]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char] ?? char));
}

export async function buildTelegramWeeklyMessage() {
  const report = await buildDashboardReport();
  const ai = await analyzeReportWithAi();
  const kpis = 'executiveKpis' in report ? report.executiveKpis : [];
  const lines = [
    '<b>BÁO CÁO TUẦN — CƠM TẤM LÀNG</b>',
    `Tình hình chung: ${stripHtml(ai.conclusion)}`,
    '',
    '<b>1. KPI chính</b>',
    ...kpis.slice(0, 8).map((kpi) => `• ${stripHtml(kpi.label)}: <b>${stripHtml(kpi.value)}</b> — ${stripHtml(kpi.trend)}`),
    '',
    '<b>2. Việc cần xử lý</b>',
    ...ai.rows.slice(0, 5).map((row, index) => `${index + 1}. [${stripHtml(row.mucDo)}] ${stripHtml(row.vanDe)} — ${stripHtml(row.viecCanLam)} (${stripHtml(row.owner)}, ${stripHtml(row.deadline)})`)
  ];
  return lines.join('\n').slice(0, 3900);
}

export async function sendTelegramMessage(text: string) {
  const env = getServerEnv();
  if (!hasTelegramEnv()) {
    return { ok: false, mode: 'missing_env' as const, message: 'Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Chưa gửi Telegram thật.' };
  }
  const botToken = env.telegramBotToken;
  const chatId = env.telegramChatId;
  if (!botToken || !chatId) {
    return { ok: false, mode: 'missing_env' as const, message: 'Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Chưa gửi Telegram thật.' };
  }
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
  });
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, mode: 'real_telegram' as const, status: response.status, message: response.ok ? 'Đã gửi Telegram thật.' : 'Telegram API lỗi.', telegramResponse: payload };
}
