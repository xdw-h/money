# Calendar Year Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the calendar sheet height stable and add an accessible year/month wheel picker.

**Architecture:** Extend the existing `DateTimePickerSheet.vue` local state and reuse its fixed-center wheel pattern. Keep calendar cells at 42 and swap the calendar grid for year/month wheels inside a stable stage.

**Tech Stack:** Vue 3, TypeScript, Vue Test Utils, Vitest, scoped CSS.

---

### Task 1: Fixed Calendar Grid

**Files:**
- Modify: `tests/unit/DateTimePickerSheet.spec.ts`
- Modify: `src/shared/components/DateTimePickerSheet.vue`

- [ ] **Step 1: Write the failing test**

Add a test that mounts August 2026, verifies 42 `[data-calendar-cell]` elements, moves to September, and verifies the count remains 42.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/DateTimePickerSheet.spec.ts`
Expected: FAIL because calendar cells are not identified and trailing cells are absent.

- [ ] **Step 3: Write minimal implementation**

Pad the computed `days` array with trailing `null` values to length 42 and add `data-calendar-cell` to each cell.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/DateTimePickerSheet.spec.ts`
Expected: PASS.

### Task 2: Year And Month Wheels

**Files:**
- Modify: `tests/unit/DateTimePickerSheet.spec.ts`
- Modify: `src/shared/components/DateTimePickerSheet.vue`

- [ ] **Step 1: Write the failing tests**

Add tests that open the month heading, verify year/month wheel options, choose `2028` and `3`, return to the calendar, and verify `2028年3月` while the selected output remains the original date until a day is selected. Add a previous-month navigation assertion from January to December of the prior year.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/DateTimePickerSheet.spec.ts`
Expected: FAIL because the month heading is not interactive and wheels do not exist.

- [ ] **Step 3: Write minimal implementation**

Add `monthPickerOpen`, year/month arrays, list refs, wheel synchronization, selection functions, accessible heading button, fixed selection band, and a year/month picker that occupies the calendar stage.

- [ ] **Step 4: Stabilize layout**

Set a fixed six-row calendar stage height for regular and short screens. Keep the year/month wheels inside this area and preserve time controls.

- [ ] **Step 5: Run component tests**

Run: `npm test -- tests/unit/DateTimePickerSheet.spec.ts`
Expected: PASS.

### Task 3: Verification

**Files:**
- Verify: `src/shared/components/DateTimePickerSheet.vue`
- Verify: `tests/unit/DateTimePickerSheet.spec.ts`

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: all tests pass with zero failures.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 3: Perform mobile visual check**

At `390x844`, confirm February and August keep the same sheet height, year/month wheels fit without overlap, and the time/action rows remain visible.

- [ ] **Step 4: Review the diff**

Run: `git diff --check` and `git status --short`.
Expected: no whitespace errors and only intended files changed.
