# QA Report — V4.6 Security & Vercel Staging Gate

## Scope

Theo duyệt: chuẩn bị deploy Vercel Preview/Staging, chỉ CEO + Kế toán, dùng Google Sheet thật, bổ sung đăng nhập thật + RBAC server-side + khóa API import/Telegram/AI.

## Files changed summary

- Added server-side auth helpers in `src/lib/auth/`.
- Added `middleware.ts` to protect pages/API.
- Added `/login` page and `/api/auth/login|logout|me|check`.
- Locked import, conflicts, reports, AI, Telegram, Google Sheets health APIs with `requireAuth`.
- Removed UI role switching from top bar.
- Updated permission matrix to only CEO + Kế toán.
- Added `docs/SKILL_AGENT_STRUCTURE_GUIDE.md` from owner-provided guide.
- Updated AI Agent contract, Vercel Env/E2E guide, UAT checklist, risk/rollback, production handoff, README, `.env.example`.

## Auth/RBAC checks

- [x] Role dropdown removed from `TopBar`.
- [x] Session user is loaded from `/api/auth/me`.
- [x] API actor is taken from authenticated session, not from client body.
- [x] Import preview/confirm/history/rollback protected.
- [x] Conflicts list/resolve protected.
- [x] Report APIs protected.
- [x] AI APIs protected.
- [x] Telegram APIs protected.
- [x] Google Sheets health protected.
- [x] Logout clears httpOnly cookie.

## Commands run

```bash
npm run static-ui-qa
npm run typecheck
```

## Results

- `npm run static-ui-qa`: PASS.
- `npm run typecheck`: could not complete because package has no `node_modules` / installed dependencies in this sandbox. Errors are dependency/type resolution errors such as missing `next`, `react`, `@types/node`, `vitest`, `xlsx`. One local type issue found in `src/lib/auth/session.ts` was fixed.

## Secret safety

- No `.env` or service account JSON added.
- `.env.example` contains only variable names/placeholders.
- Full Google Sheet ID is not written into docs.
- Telegram/Gemini/OpenAI/Google private key/password values are not included.

## Remaining required checks on real Vercel Preview

1. Set Vercel Env variables.
2. Share Google Sheet with service account.
3. Run Vercel Preview build.
4. Test unauthorized API returns 401.
5. Test CEO login.
6. Test Kế toán login.
7. Test Google Sheets health.
8. Test import preview/confirm with real accounting files.
9. Test AI fallback/real Gemini.
10. Test Telegram preview before POST send.

## Status

Staging-ready candidate after dependency install/build passes. Not production-live until UAT passes.
