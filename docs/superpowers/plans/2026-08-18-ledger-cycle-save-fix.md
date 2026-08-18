# Ledger Cycle Save Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Vue reactive ledger objects from causing IndexedDB `DataCloneError` during billing-cycle updates.

**Architecture:** Add one storage-boundary helper in `ledgerStore.ts` that rebuilds a `LedgerEntity` with plain nested date maps. Use this helper before every ledger `put`, keeping Vue reactivity out of IndexedDB.

**Tech Stack:** Vue 3, TypeScript, Dexie/IndexedDB, Vitest, fake-indexeddb

---

### Task 1: Reproduce reactive-ledger persistence failure

**Files:**
- Create: `tests/unit/ledgerStore.spec.ts`
- Modify: `src/features/ledgers/ledgerStore.ts`

- [ ] **Step 1: Write the failing test**

Create a ledger in the real test database, load it into `ledgerItems`, force Vue to expose reactive nested `cycleStartDates` and `cycleEndDates`, then call `setLedgerCycleStartDate`. Assert the promise resolves and the stored start date is `2026-08-13`. Add equivalent assertions for `setLedgerCycleEndDate` and `updateLedger`.

- [ ] **Step 2: Run the focused test**

Run Node 18 directly:

`C:\Program Files\nodejs\node.exe node_modules/vitest/vitest.mjs --run tests/unit/ledgerStore.spec.ts`

Expected: FAIL with `DataCloneError` before the fix.

- [ ] **Step 3: Implement the plain snapshot helper**

Add `toStoredLedger(ledger)` returning only `id`, `name`, `icon`, `cycleAnchorDate`, `createdAt`, and plain copies of optional `cycleStartDates` and `cycleEndDates`. Preserve `cycleStartDay` only when present for legacy migration compatibility. Pass every object sent to `db.ledgers.put` through this helper and update `ledgerItems` with the same plain object.

- [ ] **Step 4: Verify focused and full tests**

Run the focused test, then all Vitest tests and the production build with Node 18. Expected: no `DataCloneError`, all tests pass, build succeeds.

- [ ] **Step 5: Verify in the browser**

On the local settings page, set the August 2026 start date to `2026-08-13`, confirm, and verify the field remains `2026-08-13` with no alert.
