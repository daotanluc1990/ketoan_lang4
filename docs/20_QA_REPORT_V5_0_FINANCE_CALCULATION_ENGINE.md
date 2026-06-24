# QA Report V5.0 — Finance Calculation Engine

## Scope

V5.0 adds a conservative finance calculation layer for:

1. P&L Tuần
2. Cân đối rút gọn
3. Thất thoát chi tiết

The engine reads filtered source rows only. It does not write Google Sheet data, does not mutate schema, does not run Forecast Agent, and does not use Gemini to calculate numbers.

## Key implementation

- `src/lib/finance/pl-calculator.ts`
- `src/lib/finance/balance-calculator.ts`
- `src/lib/finance/loss-calculator.ts`
- `src/lib/finance/expense-classifier.ts`
- `src/lib/finance/formula-evidence.ts`
- `src/lib/finance/finance-types.ts`
- `src/components/finance/FormulaEvidencePanel.tsx`
- `src/components/finance/DataLimitationNotice.tsx`

## Business rules enforced

- Missing data must show `Chưa đủ dữ liệu`, not 0.
- Gemini does not create revenue, cost, profit, balance or loss values.
- Cashbook debt payments, capex and unclassified expenses are excluded from operating expense until accountant/CEO review.
- P&L is temporary when store COGS or required sources are missing.
- Balance is partial when inventory or debt source is missing.
- Loss detail is calculated only from `DL_THAT_THOAT_NVL` valid rows.
- Each finance metric exposes source, row count, formula, period, status and note.

## Source contract correction

V5.0 also fixes source contract references to match the real schema:

- `DL_DOANH_THU_CUA_HANG` no longer references missing column `Kênh bán`.
- `DL_TON_KHO` no longer references missing columns `Ngày`, `Mã tuần`, `Tuần`.
- Week filtering can derive ISO week from date when a source does not have a week column.

## QC result

| Command | Result | Notes |
|---|---:|---|
| `npm run typecheck` | PASS | TypeScript check passed. |
| `npm run lint` | PASS | ESLint passed with max warnings 0. |
| `npm run test -- --reporter=dot` | PASS | 12 files / 23 tests passed. |
| `npm run static-ui-qa` | PASS | Static UI QA passed. |
| `next build --experimental-build-mode compile` | PASS | Production compile passed. |
| `next build --experimental-build-mode generate` | PASS | Production generate passed. |
| `npm run build` | INCONCLUSIVE IN SANDBOX | Compile passed, then command timed out during Next.js `Running TypeScript` phase. Standalone `npm run typecheck` passed. Re-run full build on Vercel/local. |

## Remaining risks

- If only `DL_SO_QUY` exists, P&L remains incomplete by design.
- Store COGS is not available in the current store revenue source, so profit is marked temporary/partial when applicable.
- `xlsx` vulnerability remains from dependency audit history; only upload trusted internal Excel files.
- Full Vercel Preview/UAT with real Google Sheet is still required before production-live.

## Recommended UAT

After deploy preview and login:

- `/pl-tuan?weekCode=2026-W26`
- `/can-doi?weekCode=2026-W26`
- `/that-thoat-chi-tiet?weekCode=2026-W26`
- `/tong-quan?weekCode=2026-W26`
- `/api/reports/pl-tuan?weekCode=2026-W26`
- `/api/reports/can-doi?weekCode=2026-W26`
- `/api/reports/that-thoat-chi-tiet?weekCode=2026-W26`

## Definition of Done status

V5.0 is staging candidate. It is not production-live until Vercel Preview build, Google Sheet health, RBAC, and real-data UAT all pass.
