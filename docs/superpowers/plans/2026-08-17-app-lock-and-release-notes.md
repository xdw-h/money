# App Lock and Release Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local six-digit PIN or nine-dot pattern lock with a five-minute background timeout, recovery by backup import or confirmed reset, plus a maintainable release-notes center.

**Architecture:** Keep credential hashing and lock-session state in a focused `features/appLock` module, using Web Crypto PBKDF2 and localStorage for the small pre-render configuration. Gate the application shell with a dedicated lock-screen component. Store release notes as typed source data, track the last viewed version locally, and expose the same sheet for first-view and Settings access.

**Tech Stack:** Vue 3 Composition API, TypeScript, Web Crypto, localStorage, Dexie, Vitest, Vue Test Utils.

---

### Task 1: Credential hashing and lock state

**Files:**
- Create: `src/features/appLock/appLockStore.ts`
- Test: `tests/unit/appLockStore.spec.ts`

- [ ] **Step 1: Write failing tests** for creating/verifying a six-digit PIN, rejecting invalid PIN lengths, creating/verifying a four-point minimum pattern, rejecting repeated points, and proving stored JSON contains neither plaintext PIN nor pattern.

```ts
expect(await configurePin('123456')).toBe(true)
expect(await verifyCredential('123456')).toBe(true)
expect(localStorage.getItem(APP_LOCK_KEY)).not.toContain('123456')
await expect(configurePin('12345')).rejects.toThrow('请输入6位数字密码')
await expect(configurePattern([1, 2, 3])).rejects.toThrow('至少连接4个点')
```

- [ ] **Step 2: Verify RED.** Run `npm test -- --run tests/unit/appLockStore.spec.ts`; expect failure because the module does not exist.
- [ ] **Step 3: Implement** `configurePin`, `configurePattern`, `verifyCredential`, `disableAppLock`, `markBackgrounded`, `requiresUnlock`, and `unlockSession`. Derive a SHA-256 PBKDF2 value from a random 16-byte salt with 120,000 iterations; persist only `{ type, salt, verifier }`.
- [ ] **Step 4: Verify GREEN.** Run the same test and expect all cases to pass.
- [ ] **Step 5: Commit** only the store and its test with `feat: add local app lock state`.

### Task 2: Lock screen and five-minute lifecycle gate

**Files:**
- Create: `src/features/appLock/AppLockScreen.vue`
- Create: `src/features/appLock/PatternLock.vue`
- Modify: `src/App.vue`
- Modify: `src/styles/base.css`
- Test: `tests/unit/AppLockScreen.spec.ts`
- Modify: `tests/unit/app-shell.spec.ts`

- [ ] **Step 1: Write failing component tests** proving protected page content and bottom navigation are absent while locked, correct PIN unlocks, incorrect input is cleared with an error, and the pattern emits an ordered unique sequence.
- [ ] **Step 2: Verify RED.** Run `npm test -- --run tests/unit/AppLockScreen.spec.ts tests/unit/app-shell.spec.ts`; expect missing components or locked-shell assertions to fail.
- [ ] **Step 3: Implement** a full-screen themed gate. Render six PIN indicators and a numeric keypad for PIN mode; render a 3×3 pointer-driven pattern board for gesture mode. In `App.vue`, render the router and navigation only when `appUnlocked` is true.
- [ ] **Step 4: Add lifecycle handling:** on `visibilitychange` to hidden call `markBackgrounded(Date.now())`; on visible, lock when elapsed time is at least `300_000` milliseconds. Treat every fresh page load as locked when a configuration exists.
- [ ] **Step 5: Verify GREEN** with the component tests, then commit with `feat: gate the app behind local unlock`.

### Task 3: Settings setup, switching, and disabling

**Files:**
- Create: `src/features/appLock/AppLockSetupSheet.vue`
- Modify: `src/pages/SettingsPage.vue`
- Modify: `tests/unit/SettingsPage.spec.ts`

- [ ] **Step 1: Write failing tests** for opening “应用锁”, configuring PIN twice, detecting mismatched confirmation, configuring a minimum four-point pattern, and requiring current verification before switch/disable.
- [ ] **Step 2: Verify RED.** Run `npm test -- --run tests/unit/SettingsPage.spec.ts`; expect the new settings entry to be missing.
- [ ] **Step 3: Implement** the “隐私与安全” section and bottom sheet state machine: choose type → enter → confirm → save. Existing locks first enter a verify step before disable or type switch.
- [ ] **Step 4: Verify GREEN** and commit with `feat: add app lock settings`.

### Task 4: Locked recovery flows

**Files:**
- Modify: `src/features/appLock/AppLockScreen.vue`
- Create: `src/features/appLock/AppLockRecoverySheet.vue`
- Modify: `src/features/appLock/appLockStore.ts`
- Modify: `tests/unit/AppLockScreen.spec.ts`

- [ ] **Step 1: Write failing tests** proving an invalid ZIP preserves both data and lock, a valid ZIP import clears the old lock after successful import, incorrect reset phrase preserves data, and exact `确认清空` plus confirmation clears all Dexie tables and lock state.
- [ ] **Step 2: Verify RED.** Run the lock-screen test and expect recovery assertions to fail.
- [ ] **Step 3: Implement** recovery using existing `importBackup`; call `disableAppLock` only after it resolves. Add `clearAppDataAndLock(database)` that clears records, images, categories, and ledgers in one transaction before removing lock configuration.
- [ ] **Step 4: Verify GREEN** and commit with `feat: add app lock recovery`.

### Task 5: Release-notes framework

**Files:**
- Create: `src/features/releaseNotes/releaseNotes.ts`
- Create: `src/features/releaseNotes/ReleaseNotesSheet.vue`
- Modify: `src/App.vue`
- Modify: `src/pages/SettingsPage.vue`
- Modify: `package.json`
- Test: `tests/unit/releaseNotes.spec.ts`
- Modify: `tests/unit/SettingsPage.spec.ts`

- [ ] **Step 1: Write failing tests** proving the newest release is shown once after unlock, can be reopened from Settings, and the newest announcement version equals `package.json.version`.
- [ ] **Step 2: Verify RED.** Run the two release-note tests and expect missing module/UI failures.
- [ ] **Step 3: Implement** typed `ReleaseNote { version, date, title, items }`, `shouldShowLatestRelease`, `markLatestReleaseViewed`, and a themed history sheet. Seed only a current empty-framework entry titled `版本公告已启用`, without backfilling prior changes.
- [ ] **Step 4: Wire UI:** open once only after successful unlock; add Settings “版本公告” action that always opens the full history.
- [ ] **Step 5: Verify GREEN** and commit with `feat: add version announcement center`.

### Task 6: Full verification

**Files:**
- Modify only files needed to correct discovered regressions.

- [ ] **Step 1:** Run `npm test -- --run`; expect all unit tests to pass.
- [ ] **Step 2:** Run `npm run build`; expect TypeScript and Vite production build to succeed and the service-worker version placeholder to be stamped.
- [ ] **Step 3:** Run `git diff --check`; expect no whitespace errors.
- [ ] **Step 4:** Manually verify at mobile width: enable PIN, reload and unlock; background for five minutes and unlock; switch to gesture; open announcement history; test recovery warning without confirming deletion.
- [ ] **Step 5:** Commit any verification-only corrections with `fix: complete app lock verification`.

