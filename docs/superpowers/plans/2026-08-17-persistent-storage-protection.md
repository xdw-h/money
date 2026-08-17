# Persistent Storage Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser persistent-storage protection and quota visibility to the settings page.

**Architecture:** A focused storage module wraps `navigator.storage` and returns a UI-safe status object. `SettingsPage.vue` loads it on mount, automatically requests protection once when needed, and exposes a retry action without blocking other settings features.

**Tech Stack:** Vue 3, TypeScript, StorageManager API, Vitest, Vue Test Utils

---

### Task 1: Storage protection module

**Files:**
- Create: `src/features/storage/storageProtection.ts`
- Create: `tests/unit/storageProtection.spec.ts`

- [ ] **Step 1: Write failing tests**

Test `formatBytes`, supported status reads, successful and rejected persistence requests, and unsupported browsers by injecting a StorageManager-like object.

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- --run tests/unit/storageProtection.spec.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the module**

Export `StorageProtectionStatus`, `formatBytes`, `getStorageProtectionStatus`, and `requestStorageProtection`. Convert API failures into an unavailable status instead of throwing into the page.

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- --run tests/unit/storageProtection.spec.ts`
Expected: all storage protection tests pass.

### Task 2: Settings page integration

**Files:**
- Modify: `src/pages/SettingsPage.vue`
- Create: `tests/unit/SettingsPage.spec.ts`

- [ ] **Step 1: Write failing page tests**

Mock the storage module and verify the page displays usage, quota, protection state, and a retry button when protection is denied.

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- --run tests/unit/SettingsPage.spec.ts`
Expected: FAIL because the storage card is absent.

- [ ] **Step 3: Implement the storage card**

Load storage state with the existing settings mount flow, automatically request protection when supported and not already protected, show non-blocking error text, and refresh after retry.

- [ ] **Step 4: Verify focused tests pass**

Run: `npm test -- --run tests/unit/storageProtection.spec.ts tests/unit/SettingsPage.spec.ts`
Expected: both test files pass.

### Task 3: Regression verification

**Files:**
- Verify all modified source and test files.

- [ ] **Step 1: Run full unit suite**

Run: `npm test -- --run`
Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: type checking and Vite build succeed.

- [ ] **Step 3: Check patch whitespace**

Run: `git diff --check`
Expected: no output.
