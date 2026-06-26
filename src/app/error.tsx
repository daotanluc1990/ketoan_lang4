'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-900">
      <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-2xl text-amber-700">!</div>
        <h1 className="mt-4 text-2xl font-black tracking-[-0.03em]">Trang chưa tải được</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Hệ thống đang thiếu cấu hình môi trường hoặc dữ liệu chưa sẵn sàng. Bấm thử tải lại, hoặc kiểm tra Environment Variables trên Vercel mới.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button className="rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white" type="button" onClick={reset}>Tải lại</button>
          <a className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700" href="/login">Về đăng nhập</a>
        </div>
      </section>
    </main>
  );
}
