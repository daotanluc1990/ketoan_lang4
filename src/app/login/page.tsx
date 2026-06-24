'use client';

import { FormEvent, useState } from 'react';
import { Badge } from '@/components/ui/Badge';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setError(payload?.message ?? 'Không đăng nhập được. Kiểm tra lại tài khoản/mật khẩu.');
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get('next') || '/tong-quan';
      window.location.href = nextPath.startsWith('/') ? nextPath : '/tong-quan';
    } catch {
      setError('Không kết nối được máy chủ đăng nhập. Hãy thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-lang-cream px-4 py-8 text-lang-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="bg-lang-red p-8 text-white sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Cơm Tấm Làng</p>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">CEO Report Dashboard</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/85">
              Bản V4.6 dùng đăng nhập thật và RBAC server-side. Chỉ CEO và Kế toán được vào hệ thống, thao tác import, AI và Telegram được khóa bằng session bảo mật.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="neutral">Vercel staging</Badge>
              <Badge variant="warning">Real Google Sheet</Badge>
              <Badge variant="neutral">CEO + Kế toán</Badge>
            </div>
          </section>

          <section className="p-8 sm:p-10">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-lang-red">Đăng nhập bảo mật</p>
              <h2 className="mt-2 text-2xl font-black text-lang-brown">Vào bàn điều hành</h2>
              <p className="mt-2 text-sm text-lang-muted">Tài khoản được cấu hình trong Vercel Environment Variables. Không lưu mật khẩu trong code.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-lang-muted">Tài khoản</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold outline-none ring-lang-red/20 focus:ring-4"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-lang-muted">Mật khẩu</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold outline-none ring-lang-red/20 focus:ring-4"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-lang-red px-4 text-sm font-black text-white shadow-sm hover:bg-lang-redDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
              </button>
            </form>

            <p className="mt-5 text-xs leading-5 text-lang-muted">
              Nếu chưa đăng nhập được, kiểm tra các biến AUTH_* trong Vercel Env. Không nhập token Google/Telegram/Gemini/OpenAI trực tiếp vào Google Sheet hoặc source code.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
