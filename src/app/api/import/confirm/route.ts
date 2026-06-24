import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { confirmImport } from '@/lib/import/import-confirm';
import type { ImportPreviewResult } from '@/lib/import/import-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isBlocking(preview: ImportPreviewResult) {
  return preview.summary.dongLoi > 0 || preview.summary.duLieuLech > 0;
}

function actorFromUser(user: { displayName: string; username: string; role: string }) {
  return `${user.displayName} (${user.role})`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body?.preview && !body?.batch) {
    return NextResponse.json({ ok: false, message: 'Thiếu preview hoặc batch. Phải kiểm tra trước khi ghi.' }, { status: 400 });
  }

  const actor = actorFromUser(auth.user);
  try {
    if (body.batch?.files) {
      const previews = (body.batch.files as Array<{ preview: ImportPreviewResult }>).map((file) => file.preview);
      const blocking = previews.filter(isBlocking);
      if (blocking.length && body.allowPartial !== true) {
        return NextResponse.json({ ok: false, message: 'Batch còn dòng lỗi hoặc dữ liệu lệch. Không ghi Google Sheet. Hãy xử lý lỗi/lệch trước.', blockingImports: blocking.map((preview) => preview.maLanImport) }, { status: 409 });
      }
      const results = [];
      for (const preview of previews) results.push(await confirmImport(preview, actor));
      const allOk = results.every((result) => result.ok);
      return NextResponse.json({ ok: allOk, mode: 'batch', actor, results }, { status: allOk ? 200 : 409 });
    }
    const preview = body.preview as ImportPreviewResult;
    if (isBlocking(preview) && body.allowPartial !== true) {
      return NextResponse.json({ ok: false, message: 'Preview còn dòng lỗi hoặc dữ liệu lệch. Không ghi Google Sheet. Hãy xử lý lỗi/lệch trước.' }, { status: 409 });
    }
    const result = await confirmImport(preview, actor);
    return NextResponse.json({ ...result, actor }, { status: result.ok ? 200 : 409 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Không xác nhận import được.' }, { status: 500 });
  }
}
