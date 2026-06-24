# QA Report — V4.7 Data Filter & Source Contract

## Tình hình chung

Đạt ở mức source package / Vercel Preview Candidate.

V4.7 tập trung vào bộ lọc thật và hợp đồng nguồn dữ liệu. Bản này không ghi Google Sheet, không thay đổi schema, không làm rollback dữ liệu, không thêm Agent Dự toán.

## Files/areas changed

- `src/lib/reports/report-filters.ts`
- `src/lib/reports/source-contract.ts`
- `src/lib/reports/row-normalizers.ts`
- `src/lib/reports/report-aggregator.ts`
- `src/lib/reports/page-search-params.ts`
- `src/app/api/reports/filter-options/route.ts`
- Report API routes now pass query params into the aggregator.
- Main report pages now pass URL search params into the aggregator.
- `src/components/layout/GlobalFilterBar.tsx` now reads filter options from real data and writes filters into URL query.
- AI report analysis now receives the same report filter query.

## What works

- Filter options are generated from real source rows, not hard-coded choices.
- Common filter contract supports date range, week, branch, channel, cost group, source, data status, alert status and imported user.
- Dashboard/P&L/cashflow/balance/loss/accounting workspace/forecast/bot preview consume the same filtered report result.
- API responses include `filterMetadata` for evidence and before/after source row counts.
- If no row matches the filter, the app returns `Chưa đủ dữ liệu để kết luận` instead of showing fake zeroes.

## Commands run

| Command | Result |
|---|---|
| `npm install` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS — 6 files / 10 tests |
| `npm run build` | PASS |
| `npm run static-ui-qa` | PASS |

## Remaining risks

- V4.7 only standardizes filtering/source contract. It does not complete accounting-grade P&L, balance sheet, debt, purchase analytics or data rollback.
- Filter options depend on data quality in the 7 source sheets. If source rows use inconsistent branch/channel names, options will reflect those inconsistencies.
- `xlsx` remains a dependency with known audit warnings. Keep Preview protected and only upload trusted internal Excel files.
- Real Google Sheet + Vercel Preview UAT is still required.

## Next recommended step

Deploy Vercel Preview, login as CEO/Kế toán, then test these URLs after configuring env:

```text
/tong-quan?weekCode=2026-W23&branch=Làng%20NVT
/api/reports/dashboard?weekCode=2026-W23&branch=Làng%20NVT
/api/reports/filter-options
/api/ai/report-analysis?weekCode=2026-W23&branch=Làng%20NVT
```
