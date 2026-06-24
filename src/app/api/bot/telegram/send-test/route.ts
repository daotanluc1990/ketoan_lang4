import { GET as telegramGet, POST as telegramPost } from '@/app/api/telegram/send-test/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = telegramGet;
export const POST = telegramPost;
