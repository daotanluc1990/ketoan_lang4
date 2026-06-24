'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ReportTable } from '@/components/report/ReportTable';

type ImportPreviewSummary = {
  dongMoi: number;
  duLieuTrung: number;
  duLieuLech: number;
  dongLoi: number;
};

type ImportPreview = {
  maLanImport: string;
  loaiDuLieu: string;
  chiNhanh: string;
  tenFile: string;
  summary: ImportPreviewSummary;
};

type BatchPreviewFile = {
  tenFile: string;
  loaiDuLieu: string;
  chiNhanh: string;
  warnings: string[];
  preview: ImportPreview;
};

type BatchPreview = {
  maBatch: string;
  files: BatchPreviewFile[];
  summary: {
    soFile: number;
    dongMoi: number;
    duLieuTrung: number;
    duLieuLech: number;
    dongLoi: number;
    soFileKhongNhanDien: number;
  };
};

function statusFromFile(file: BatchPreviewFile) {
  if (file.preview.summary.dongLoi > 0) return 'Có lỗi';
  if (file.preview.summary.duLieuLech > 0) return 'Cần đối chiếu';
  if (file.warnings.length || file.loaiDuLieu === 'Không nhận diện được') return 'Cảnh báo';
  return 'Đạt';
}

export function BatchUploadMock() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('Chọn file rồi bấm Kiểm tra batch. Preview không ghi vào Google Sheet.');

  const rows = useMemo(() => {
    if (!preview) return selectedFiles.map((file: File) => [file.name, 'Chưa kiểm tra', '—', '—', '—', '—', '—', '—', 'Chưa đủ dữ liệu']);
    return preview.files.map((file: BatchPreviewFile) => [
      file.tenFile,
      file.loaiDuLieu,
      'Tự nhận diện',
      file.chiNhanh,
      String(file.preview.summary.dongMoi),
      String(file.preview.summary.duLieuTrung),
      String(file.preview.summary.duLieuLech),
      String(file.preview.summary.dongLoi),
      statusFromFile(file)
    ]);
  }, [preview, selectedFiles]);

  const canConfirm = Boolean(preview && preview.summary.dongLoi === 0 && preview.summary.duLieuLech === 0 && preview.summary.soFileKhongNhanDien === 0);

  async function checkBatch() {
    if (!selectedFiles.length) {
      setMessage('Chưa có file Excel nào. Hãy chọn ít nhất 1 file.');
      return;
    }
    setLoading(true);
    setPreview(null);
    setMessage('Đang kiểm tra batch, chưa ghi Google Sheet...');
    try {
      const formData = new FormData();
      for (const file of selectedFiles) formData.append('files', file);
      formData.append('actor', 'web-ketoan');
      const response = await fetch('/api/import/preview', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? 'Không preview được batch.');
      setPreview(payload.data);
      setMessage('Đã kiểm tra batch. Chỉ bấm Import file đạt khi Lỗi = 0, Lệch = 0 và Trạng thái = Đạt.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không kiểm tra được batch.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmBatch() {
    if (!preview) return;
    setConfirming(true);
    setMessage('Đang ghi dữ liệu vào Google Sheet...');
    try {
      const response = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ batch: preview, actor: 'web-ketoan' })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? 'Không import được batch.');
      const writtenRows = Array.isArray(payload.results) ? payload.results.reduce((total: number, item: { writtenRows?: number }) => total + (item.writtenRows ?? 0), 0) : 0;
      setMessage(`Đã ghi Google Sheet: ${writtenRows} dòng mới. Hãy mở các sheet DL_* để kiểm tra từ dòng 4 trở xuống.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import file đạt thất bại.');
    } finally {
      setConfirming(false);
    }
  }

  function cancelBatch() {
    setSelectedFiles([]);
    setPreview(null);
    setMessage('Đã hủy batch trên màn hình. Chưa thay đổi Google Sheet.');
  }

  function downloadErrorFile() {
    const errorRows = preview?.files.flatMap((file: BatchPreviewFile) => file.preview.summary.dongLoi || file.preview.summary.duLieuLech ? [{ file: file.tenFile, loaiDuLieu: file.loaiDuLieu, loi: file.preview.summary.dongLoi, lech: file.preview.summary.duLieuLech, warnings: file.warnings.join('; ') }] : []) ?? [];
    const blob = new Blob([JSON.stringify(errorRows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import-loi-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <label className="block rounded-2xl border-2 border-dashed border-lang-red/30 bg-lang-cream/70 p-4 text-center transition hover:border-lang-red">
        <input
          className="sr-only"
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setSelectedFiles(Array.from(event.target.files ?? []));
            setPreview(null);
            setMessage('Đã chọn file. Bấm Kiểm tra batch để preview thật.');
          }}
        />
        <span className="text-base font-bold text-lang-brown">Kéo thả hoặc bấm để chọn nhiều file</span>
        <span className="mt-2 block text-sm text-black/60">Hỗ trợ upload cùng lúc 4–5 file: doanh thu app, doanh thu cửa hàng, sổ quỹ, tồn kho, thất thoát.</span>
      </label>

      {selectedFiles.length > 0 ? (
        <div className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
          <p className="font-bold text-lang-brown">File vừa chọn trong máy:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-black/65">
            {selectedFiles.map((file: File) => <li key={`${file.name}-${file.size}`}>{file.name}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl bg-white p-3 text-sm text-black/65 shadow-sm ring-1 ring-black/5">{message}</div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={checkBatch} disabled={loading}>{loading ? 'Đang kiểm tra...' : 'Kiểm tra batch'}</Button>
        <Button variant="secondary" onClick={confirmBatch} disabled={!canConfirm || confirming}>{confirming ? 'Đang import...' : 'Import file đạt'}</Button>
        <Button variant="secondary" onClick={downloadErrorFile} disabled={!preview}>Tải file lỗi</Button>
        <Button variant="danger" onClick={cancelBatch}>Hủy batch</Button>
      </div>

      <ReportTable
        headers={['File', 'Loại dữ liệu', 'Kỳ', 'Chi nhánh', 'Dòng mới', 'Trùng', 'Lệch', 'Lỗi', 'Trạng thái']}
        rows={rows}
      />
    </div>
  );
}
