import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { previewImport } from '@/lib/import/import-preview';
import { previewExcelBatch } from '@/lib/import/parsers/excel-batch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function actorFromUser(user: { displayName: string; username: string; role: string }) {
  return `${user.displayName} (${user.role})`;
}

async function handleMultipart(request: NextRequest, actor: string) {
  const formData = await request.formData();
  const rawFiles = [...formData.getAll('files'), ...formData.getAll('file')].filter((value): value is File => value instanceof File);
  if (!rawFiles.length) {
    return NextResponse.json({ ok: false, message: 'Chưa có file Excel nào. Hãy upload ít nhất 1 file.' }, { status: 400 });
  }
  const files = await Promise.all(rawFiles.map(async (file) => ({ filename: file.name, buffer: Buffer.from(await file.arrayBuffer()) })));
  const result = await previewExcelBatch(files, actor);
  return NextResponse.json({ ok: true, data: result, actor });
}

async function handleJson(request: NextRequest, actor: string) {
  const body = await request.json().catch(() => null);
  if (!body?.rows || !body?.sheetDich) {
    return NextResponse.json({ ok: false, message: 'Thiếu rows hoặc sheetDich. Với Excel thật, hãy gửi multipart/form-data field files[].' }, { status: 400 });
  }
  const result = await previewImport({
    loaiDuLieu: body.loaiDuLieu ?? 'Chưa xác định',
    chiNhanh: body.chiNhanh ?? 'NVT',
    tenFile: body.tenFile ?? 'manual.json',
    dauVetFile: body.dauVetFile ?? `manual-${Date.now()}`,
    sheetDich: body.sheetDich,
    rows: body.rows,
    actor
  });
  return NextResponse.json({ ok: true, data: result, actor });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['CEO', 'Kế toán']);
  if (!auth.ok) return auth.response;

  const actor = actorFromUser(auth.user);
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('multipart/form-data')) return await handleMultipart(request, actor);
    return await handleJson(request, actor);
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Không preview được dữ liệu import.' }, { status: 500 });
  }
}
