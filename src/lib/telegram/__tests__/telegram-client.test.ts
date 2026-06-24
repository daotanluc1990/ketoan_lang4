import { describe, expect, it } from 'vitest';
import { sendTelegramMessage } from '../telegram-client';

describe('sendTelegramMessage', () => {
  it('does not send when Telegram env is missing', async () => {
    const oldToken = process.env.TELEGRAM_BOT_TOKEN;
    const oldChat = process.env.TELEGRAM_CHAT_ID;
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    const result = await sendTelegramMessage('test');
    expect(result.ok).toBe(false);
    expect(result.mode).toBe('missing_env');
    if (oldToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN; else process.env.TELEGRAM_BOT_TOKEN = oldToken;
    if (oldChat === undefined) delete process.env.TELEGRAM_CHAT_ID; else process.env.TELEGRAM_CHAT_ID = oldChat;
  });
});
