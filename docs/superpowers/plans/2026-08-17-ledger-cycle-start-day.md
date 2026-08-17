# Ledger Cycle Start Day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every ledger choose a full anchor date and generate continuous monthly cycles forward and backward from it.

**Architecture:** A shared calendar-date helper calculates `[start, endExclusive)` from a full `cycleAnchorDate` with short-month clamping. The ledger store migrates the temporary `cycleStartDay` field and persists the complete date; aggregation and pages consume the active ledger anchor.

**Tech Stack:** Vue 3, TypeScript, Dexie, Vitest

---

### Task 1: Add shared cycle calculations

**Files:**
- Modify: `src/shared/format/date.ts`
- Modify: `tests/unit/format.spec.ts`

- [ ] Add failing tests for days 1, 5, 15, 28–31, February, leap February, cross-year, and anchors before/after the start day.
- [ ] Implement `billingCycleRange(anchor, cycleStartDay)` returning `start`, `endExclusive`, and display-safe `endInclusive` calendar strings.
- [ ] Verify `npm test -- --run tests/unit/format.spec.ts` passes.

### Task 2: Persist the setting per ledger

**Files:**
- Modify: `src/features/records/types.ts`
- Modify: `src/features/ledgers/ledgerStore.ts`
- Modify: `src/shared/db/database.ts`
- Modify: `src/features/backup/backupService.ts`
- Modify: `tests/unit/backupService.spec.ts`

- [ ] Add failing legacy-backup coverage proving missing values normalize to `1`.
- [ ] Add `cycleStartDay` to `LedgerEntity`, default new and migrated ledgers to `1`, clamp saved values to `1–31`, and normalize imported ledgers.
- [ ] Verify backup and repository tests pass.

### Task 3: Apply cycles to aggregation and pages

**Files:**
- Modify: `src/features/statistics/aggregate.ts`
- Modify: `tests/unit/aggregate.spec.ts`
- Modify: `src/pages/HomePage.vue`
- Modify: `src/pages/BillsPage.vue`

- [ ] Add failing aggregation tests for the inclusive start and exclusive next start boundaries.
- [ ] Extend month aggregation options with `cycleStartDay`; keep year behavior unchanged and generate daily trend labels over the custom cycle.
- [ ] Pass the active ledger setting to home summaries, home “本月” records, monthly bills, rankings, trends, and details.
- [ ] Display the active cycle date range using `YYYY-MM-DD`.

### Task 4: Add ledger setting UI and verify

**Files:**
- Modify: `src/pages/SettingsPage.vue`
- Modify: `tests/unit/app-shell.spec.ts`

- [ ] Add an accessible `1–31` start-day selector to each ledger row and save changes through the ledger store.
- [ ] Run `npm test -- --run`, `npm run build`, and mobile layout checks.
- [ ] Verify two ledgers retain different start days after switching and refreshing.

### Task 5: Preserve mixed workspace changes

- [ ] Run `git diff --check` and inspect the final diff.
- [ ] Do not commit implementation files if staging would include the user's pre-existing edits in overlapping files.
