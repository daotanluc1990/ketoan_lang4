# UI Implementation Guardrail

Version: 1.0
Scope: ERP Mini Bao Cao Ke Toan Com Tam Lang

## Rule 1: pilot first

When redesigning the dashboard UI, start with one pilot screen only.

Default pilot screen: Tong quan ke toan.

Do not apply a visual direction to every screen immediately.

## Rule 2: avoid global edits before approval

Before the pilot screen is visually approved, do not change shared layout or shared components used by all pages.

Use isolated pilot components instead, for example:

- ErpKpiCard
- ErpPageHeader
- ErpDataTable
- ErpStatusFilter
- ErpInsightPanel
- ErpActionBar

Apply those components only to the pilot page.

## Rule 3: one change group per step

Each implementation step should touch only one group:

1. one page, or
2. one isolated component group, or
3. shell/sidebar/topbar after pilot approval.

Do not change page layout, shared components, and shell/sidebar/topbar in the same step.

## Rule 4: visual QA checklist

After each UI change, verify:

- layout fits desktop 1366x768 and 1440x900
- no large wasted space
- KPI, cards, and tables are balanced
- important table columns are not clipped
- main action is obvious
- status colors are not noisy
- temporary numbers do not look finalized
- empty, loading, and error states are clear
- no debug text is visible to normal users

## Rule 5: owner visual approval

After the pilot screen is implemented:

1. report what changed
2. ask the owner to inspect the screen
3. list what still differs from the preview
4. wait for approval before applying the style to more pages

## Rule 6: wrong direction handling

If the owner says the UI is wrong, noisy, hard to read, or inconsistent with the mockup:

1. stop adding new UI changes
2. roll back the last UI step if approved
3. restart with a single pilot screen

Do not layer more UI changes on top of a wrong direction.
