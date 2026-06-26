# UI Status

Done:
- Main ERP pages use isolated UI components.
- Main ERP pages use the pilot shell.
- PnL TypeScript status comparison was fixed.
- Vercel build passed on the new project.
- Filter bar sticky position now matches the compact 54px topbar.
- Overview KPI row is reduced to the core 6 KPIs.
- Overview page header and status strip are more compact.
- KPI cards are denser and easier to scan.

Still pending:
- Shell still has some legacy hardcoded text/actions that need a smaller follow-up patch if visual QA requires it.
- Extra route-specific filters beyond date and branch are not implemented yet.
- Secondary pages outside the main ERP group are not confirmed.
- Login-based visual QA still needs final owner screenshots.

Current QA focus:
- Check /tong-quan first.
- Confirm title size, KPI card density, status strip height, table readability, filter sticky position, sidebar collapse, and sticky action bar spacing.
