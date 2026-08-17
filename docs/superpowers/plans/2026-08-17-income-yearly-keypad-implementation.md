# Income Layout, Yearly Bills, and Keypad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make income categories compact, support historical yearly reporting with cumulative balance, and move saving into a reference-aligned 4×4 keypad.

**Architecture:** Keep records unchanged in IndexedDB and derive yearly and cumulative statistics from ledger-scoped records. Add small pure aggregation functions and component events so business rules remain testable outside the UI. Apply type-specific category grid classes without restructuring the editor.

**Tech Stack:** Vue 3, TypeScript, Dexie, Vitest, Vue Test Utils, Playwright

---

### Task 1: Yearly and cumulative statistics

**Files:**
- Modify: `src/features/statistics/aggregate.ts`
- Modify: `src/pages/BillsPage.vue`
- Test: `tests/unit/aggregate.spec.ts`

- [ ] **Step 1: Write the failing cumulative-balance test**

Add records in 2025, 2026, and 2027, then assert a new `summarizeThroughYear(records, { anchor, timeZone })` includes records through the selected year end and excludes later records.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `rtk npm test -- --run tests/unit/aggregate.spec.ts`

Expected: FAIL because `summarizeThroughYear` is not exported.

- [ ] **Step 3: Implement the pure cumulative calculation**

Add an exported function that obtains the selected year from `anchor`, filters records whose local calendar year is less than or equal to it, and returns the existing `{ income, expense, balance, count }` shape.

- [ ] **Step 4: Add explicit year navigation and cumulative summary**

In `BillsPage.vue`, replace the free numeric input with previous/next year buttons and a displayed year. Do not disable navigation when a year has no data. Add a computed cumulative summary and display both `本年结余` and `截至 YYYY 年末累计结余`.

- [ ] **Step 5: Run unit tests**

Run: `rtk npm test -- --run tests/unit/aggregate.spec.ts`

Expected: all aggregate tests PASS.

### Task 2: Historical record dates

**Files:**
- Modify: `src/features/records/RecordEditor.vue`
- Test: `tests/unit/RecordEditor.spec.ts`
- Test: `tests/e2e/bookkeeping-flow.spec.ts`

- [ ] **Step 1: Write the historical-date tests**

Mount the editor, set the `datetime-local` input to `2024-03-15T08:30`, enter an amount, submit, and assert emitted `occurredAt` represents that local date. Add an end-to-end case that creates a prior-year record and finds it after switching the annual bill to that year.

- [ ] **Step 2: Run the focused unit test and verify current behavior**

Run: `rtk npm test -- --run tests/unit/RecordEditor.spec.ts`

Expected: PASS if the existing editor already accepts historical dates; otherwise FAIL at date conversion or submission and expose the root cause.

- [ ] **Step 3: Apply only the confirmed date fix**

If the test fails, correct the editor date conversion while preserving ISO storage and local `YYYY-MM-DD HH:mm` presentation. Do not add a minimum date. If it passes, retain production date code and treat the reported problem as year-navigation discoverability fixed in Task 1.

- [ ] **Step 4: Run record tests**

Run: `rtk npm test -- --run tests/unit/RecordEditor.spec.ts tests/unit/recordRepository.spec.ts`

Expected: all selected tests PASS.

### Task 3: Income category grid and 4×4 keypad

**Files:**
- Modify: `src/features/records/RecordEditor.vue`
- Modify: `src/features/records/AmountKeypad.vue`
- Test: `tests/unit/AmountKeypad.spec.ts`
- Test: `tests/unit/RecordEditor.spec.ts`
- Test: `tests/e2e/mobile-layout.spec.ts`

- [ ] **Step 1: Write failing keypad layout tests**

Assert the keys are `1,2,3,⌫,4,5,6,-,7,8,9,+,blank,0,.,保存`, the blank cell is disabled, and clicking 保存 emits a save event rather than an amount key.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `rtk npm test -- --run tests/unit/AmountKeypad.spec.ts tests/unit/RecordEditor.spec.ts`

Expected: FAIL because operators, blank cell, and keypad save are absent.

- [ ] **Step 3: Implement keypad events and editor submission**

Give `AmountKeypad` separate `key` and `save` emits, render the fixed 4×4 cells, disable the blank and save cells appropriately, and wire `@save` to the editor form submission. Remove the separate `.save-button`. Extend the existing amount-entry function to handle `+` and `-` using the current displayed amount as the left operand and the next typed amount as the right operand.

- [ ] **Step 4: Implement the income-only two-row grid**

Add an income class to `.category-grid`. Keep the base three-row rule for expense and override income to two rows. Preserve fixed grid height and horizontal scrolling so additional income categories never create a third row.

- [ ] **Step 5: Run focused and full verification**

Run: `rtk npm test -- --run tests/unit/AmountKeypad.spec.ts tests/unit/RecordEditor.spec.ts tests/unit/aggregate.spec.ts`

Run: `rtk npm test -- --run`

Run: `rtk npm run build`

Expected: all unit tests PASS and the production build succeeds.

### Task 4: Mobile regression verification

**Files:**
- Modify only if assertions are stale: `tests/e2e/bookkeeping-flow.spec.ts`
- Modify only if assertions are stale: `tests/e2e/mobile-layout.spec.ts`

- [ ] **Step 1: Run mobile flows**

Run: `rtk npx playwright test tests/e2e/bookkeeping-flow.spec.ts tests/e2e/mobile-layout.spec.ts`

Expected: record creation, year switching, keypad saving, and no-page-scroll assertions PASS.

- [ ] **Step 2: Check the final diff**

Run: `rtk git diff --check`

Expected: no whitespace errors. Confirm unrelated pre-existing test changes remain intact.
