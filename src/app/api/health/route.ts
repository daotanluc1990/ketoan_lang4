import { NextResponse } from 'next/server';
import { getEnvChecklist, hasAiEnv, hasGoogleSheetsEnv, hasTelegramEnv } from '@/lib/env/server-env';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    ok: true,
    app: 'Cơm Tấm Làng — CEO Report Dashboard',
    phase: 'V4.4 End-to-End foundation',
    dataStore: process.env.DATA_STORE ?? 'local',
    integrations: {
      googleSheetsReady: hasGoogleSheetsEnv(),
      aiReady: hasAiEnv(),
      telegramReady: hasTelegramEnv()
    },
    env: getEnvChecklist().map((item) => ({ name: item.name, configured: item.configured, requiredFor: item.requiredFor }))
  });
}
