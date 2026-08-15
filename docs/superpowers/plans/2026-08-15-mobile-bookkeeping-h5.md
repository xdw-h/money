# Mobile Bookkeeping H5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable, offline-capable mobile bookkeeping PWA with local records, multi-image receipts, monthly/yearly statistics, and ZIP backup/restore.

**Architecture:** Vue pages use Pinia stores and focused composables; all persistence goes through an IndexedDB repository so UI code never manipulates storage directly. Image processing and ZIP backup are separate services, while derived statistics remain pure functions with unit tests.

**Tech Stack:** Vue 3, TypeScript, Vite, Vue Router, Pinia, Dexie, ECharts, JSZip, vite-plugin-pwa, Vitest, Vue Test Utils, Playwright.

---

## File map

- `src/features/records/`: record model, repository, store, editor, recent list.
- `src/features/images/`: compression, thumbnail generation, upload preview, gallery.
- `src/features/statistics/`: pure aggregations and charts.
- `src/features/backup/`: ZIP export/import and validation.
- `src/shared/`: date, money, database, reusable UI.
- `src/pages/`: Home, RecordEditor, Bills, Settings.
- `tests/unit/`: pure logic, repositories, stores, components.
- `tests/e2e/`: mobile workflows and PWA smoke coverage.

### Task 1: Bootstrap the tested Vue PWA

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.ts`, `src/App.vue`, `src/router.ts`, `src/styles/tokens.css`, `src/styles/base.css`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Create: `tests/unit/app-shell.spec.ts`

- [ ] **Step 1: Initialize source control and scaffold dependencies**

Run:

```powershell
git init
npm init -y
npm install vue vue-router pinia dexie echarts jszip
npm install -D vite typescript @vitejs/plugin-vue vite-plugin-pwa vitest jsdom @vue/test-utils playwright
```

Expected: dependencies install and `.git/` exists.

- [ ] **Step 2: Write the failing app-shell test**

```ts
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'

it('renders the mobile navigation', () => {
  const wrapper = mount(App, { global: { stubs: ['RouterView', 'RouterLink'] } })
  expect(wrapper.text()).toContain('首页')
  expect(wrapper.text()).toContain('账单')
  expect(wrapper.text()).toContain('设置')
})
```

- [ ] **Step 3: Run the test and confirm the red state**

Run: `npm test -- --run tests/unit/app-shell.spec.ts`

Expected: FAIL because `src/App.vue` does not exist.

- [ ] **Step 4: Add Vite, router, Pinia, PWA manifest, app shell, and CSS tokens**

Implement routes `/`, `/record/new`, `/record/:id`, `/bills`, `/settings`; register `VitePWA` with `display: standalone`, theme `#f4f1e9`, and 192/512 icons. `App.vue` renders `RouterView` plus a safe-area-aware bottom navigation and central add button.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- --run tests/unit/app-shell.spec.ts && npm run build`

Expected: PASS and `dist/` contains `manifest.webmanifest` plus service-worker assets.

```powershell
git add package.json package-lock.json vite.config.ts tsconfig.json index.html src public tests
git commit -m "chore: bootstrap bookkeeping pwa"
```

### Task 2: Define record data and IndexedDB repository

**Files:**
- Create: `src/features/records/types.ts`
- Create: `src/shared/db/database.ts`
- Create: `src/features/records/recordRepository.ts`
- Create: `tests/unit/recordRepository.spec.ts`

- [ ] **Step 1: Write failing repository tests**

Test that `createRecord()` stores integer cents, `updateRecord()` changes `updatedAt`, `deleteRecord()` removes linked images transactionally, and `listRecords({ from, to })` returns newest first.

```ts
const saved = await repository.createRecord({
  type: 'expense', amount: 24000, categoryId: 'health',
  occurredAt: '2026-08-15T04:00:00.000Z', note: '牙科', imageIds: []
})
expect(saved.amount).toBe(24000)
expect(await repository.listRecords({ from: '2026-08-01', to: '2026-09-01' })).toHaveLength(1)
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- --run tests/unit/recordRepository.spec.ts`

Expected: FAIL because repository modules are missing.

- [ ] **Step 3: Implement types, Dexie schema, and repository**

Use `RecordEntity` with `id`, `type`, integer `amount`, `categoryId`, ISO `occurredAt`, `note`, `imageIds`, `createdAt`, and `updatedAt`. Create Dexie stores `records`, `images`, and `categories`; wrap record/image deletes in `db.transaction('rw', ...)`.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run tests/unit/recordRepository.spec.ts`

Expected: PASS.

```powershell
git add src/features/records src/shared/db tests/unit/recordRepository.spec.ts
git commit -m "feat: add local record repository"
```

### Task 3: Add stable money and date formatting

**Files:**
- Create: `src/shared/format/money.ts`, `src/shared/format/date.ts`
- Create: `tests/unit/format.spec.ts`

- [ ] **Step 1: Write failing format tests**

```ts
expect(formatMoney(24000)).toBe('¥240.00')
expect(formatDateTime('2026-08-05T08:23:10.000+00:00', 'Asia/Shanghai'))
  .toBe('2026-08-05 16:23:10')
expect(formatDate('2026-08-05 08:23:10')).toBe('2026-08-05')
expect(formatDateTime(null)).toBe('-')
expect(formatDateTime('broken')).toBe('-')
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- --run tests/unit/format.spec.ts`

Expected: FAIL because format functions are missing.

- [ ] **Step 3: Implement formatters**

Use `Intl.DateTimeFormat('zh-CN', { timeZone, year, month, day, hour, minute, second, hour12: false })`, assemble fixed-width output from `formatToParts`, and return `-` for null or invalid input. Never expose `T`, milliseconds, `Z`, or offsets in UI strings.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run tests/unit/format.spec.ts`

Expected: PASS for ISO, timezone, database-style, empty, and invalid inputs.

```powershell
git add src/shared/format tests/unit/format.spec.ts
git commit -m "feat: add safe date and money formatting"
```

### Task 4: Implement multi-image processing and immediate preview

**Files:**
- Create: `src/features/images/imageService.ts`
- Create: `src/features/images/ImageUploader.vue`, `src/features/images/ImageGallery.vue`
- Create: `tests/unit/imageService.spec.ts`, `tests/unit/ImageUploader.spec.ts`

- [ ] **Step 1: Write failing service and component tests**

Test rejection of non-images, generation of image/thumbnail blobs, immediate `URL.createObjectURL` preview, multi-select input, removal, and camera capture attributes.

```ts
expect(wrapper.get('input[type=file]').attributes('multiple')).toBeDefined()
expect(wrapper.get('input[type=file]').attributes('accept')).toBe('image/*')
await wrapper.get('input[type=file]').trigger('change')
expect(wrapper.findAll('[data-testid=image-preview]')).toHaveLength(2)
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- --run tests/unit/imageService.spec.ts tests/unit/ImageUploader.spec.ts`

Expected: FAIL because the modules are missing.

- [ ] **Step 3: Implement image processing and UI**

Validate `image/*`; decode with `createImageBitmap`; constrain the long edge to 1920px for stored images and 320px for thumbnails; encode JPEG/WebP near 0.82 quality. Revoke object URLs on removal/unmount. `ImageGallery` provides full-screen dialog, swipe/arrow navigation, count, close, and delete.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run tests/unit/imageService.spec.ts tests/unit/ImageUploader.spec.ts`

Expected: PASS, including corrupt file and cleanup cases.

```powershell
git add src/features/images tests/unit/imageService.spec.ts tests/unit/ImageUploader.spec.ts
git commit -m "feat: add multi-image receipts and preview"
```

### Task 5: Build the quick record editor

**Files:**
- Create: `src/features/records/categories.ts`, `src/features/records/recordStore.ts`
- Create: `src/features/records/RecordEditor.vue`, `src/features/records/AmountKeypad.vue`
- Create: `src/pages/RecordEditorPage.vue`
- Create: `tests/unit/RecordEditor.spec.ts`

- [ ] **Step 1: Write failing editor tests**

Cover expense/income switching, category selection, decimal keypad, note/date input, multi-image draft, disabled zero-value save, successful transaction, and preserved form after quota failure.

```ts
await wrapper.get('[data-key="2"]').trigger('click')
await wrapper.get('[data-key="4"]').trigger('click')
await wrapper.get('[data-key="0"]').trigger('click')
expect(wrapper.get('[data-testid=amount]').text()).toContain('¥240.00')
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- --run tests/unit/RecordEditor.spec.ts`

Expected: FAIL because editor components are missing.

- [ ] **Step 3: Implement editor and atomic save**

Use reference-inspired category circles and a 3×4 keypad. Save images and record in one repository transaction; show explicit unsupported-image/storage-full errors; navigate home only after success. Use shared date formatting for every displayed date.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run tests/unit/RecordEditor.spec.ts`

Expected: PASS.

```powershell
git add src/features/records src/pages/RecordEditorPage.vue tests/unit/RecordEditor.spec.ts
git commit -m "feat: build quick record editor"
```

### Task 6: Build home dashboard and statistics

**Files:**
- Create: `src/features/statistics/aggregate.ts`, `src/features/statistics/TrendChart.vue`
- Create: `src/features/records/RecentRecordList.vue`
- Create: `src/pages/HomePage.vue`, `src/pages/BillsPage.vue`
- Create: `tests/unit/aggregate.spec.ts`, `tests/unit/BillsPage.spec.ts`

- [ ] **Step 1: Write failing aggregation and page tests**

Use fixtures spanning month/year boundaries and assert balance, expense/income totals, daily/monthly series, category ranking, and bill filters.

```ts
expect(summarize(records, { mode: 'month', anchor: '2026-08-15' })).toMatchObject({
  income: 300000, expense: 24000, balance: 276000
})
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- --run tests/unit/aggregate.spec.ts tests/unit/BillsPage.spec.ts`

Expected: FAIL because statistics modules are missing.

- [ ] **Step 3: Implement dashboard, bill filters, chart, ranking, and details**

Keep aggregation pure. Render ECharts only when data exists; otherwise show an actionable empty state. Support month/year, income/expense, bar/line toggles; opening a record displays all attached images through `ImageGallery`.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run tests/unit/aggregate.spec.ts tests/unit/BillsPage.spec.ts`

Expected: PASS.

```powershell
git add src/features/statistics src/features/records/RecentRecordList.vue src/pages/HomePage.vue src/pages/BillsPage.vue tests/unit
git commit -m "feat: add dashboard and bill statistics"
```

### Task 7: Implement versioned ZIP backup and restore

**Files:**
- Create: `src/features/backup/types.ts`, `src/features/backup/backupService.ts`
- Create: `src/pages/SettingsPage.vue`
- Create: `tests/unit/backupService.spec.ts`

- [ ] **Step 1: Write failing backup tests**

Test manifest version, `records.json`, image files, round-trip restore, duplicate-ID skipping, missing images, unsupported version, corrupt ZIP, and no writes on validation failure.

```ts
const zip = await exportBackup(repository)
const result = await importBackup(zip, emptyRepository)
expect(result).toEqual({ imported: 1, skipped: 0, images: 2 })
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- --run tests/unit/backupService.spec.ts`

Expected: FAIL because backup service is missing.

- [ ] **Step 3: Implement validated export/import and settings UI**

Export `manifest.json`, `records.json`, and `images/<id>.<ext>`. Parse and validate the entire archive before opening a write transaction. Skip duplicate record IDs and report counts. Add destructive confirmation before clearing all IndexedDB tables.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run tests/unit/backupService.spec.ts`

Expected: PASS; corrupt/unsupported backups leave row counts unchanged.

```powershell
git add src/features/backup src/pages/SettingsPage.vue tests/unit/backupService.spec.ts
git commit -m "feat: add zip backup and restore"
```

### Task 8: Apply reference visual system and responsive layout

**Files:**
- Modify: `src/styles/tokens.css`, `src/styles/base.css`
- Modify: all page and feature `.vue` files
- Create: `tests/e2e/mobile-layout.spec.ts`

- [ ] **Step 1: Write failing mobile layout checks**

At 375×812, 390×844, and 430×932, assert no horizontal overflow, bottom navigation visibility, reachable central add button, and visible upload previews.

```ts
expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
await expect(page.getByRole('link', { name: '新增记账' })).toBeInViewport()
```

- [ ] **Step 2: Confirm failure**

Run: `npx playwright test tests/e2e/mobile-layout.spec.ts`

Expected: FAIL until responsive styles and pages are complete.

- [ ] **Step 3: Implement visual tokens and responsive polish**

Use a CSS grid-paper background, cream cards, dark 2px outlines, blue income, coral expense, warm yellow category charts, system Chinese fonts, safe-area insets, minimum 44px controls, and reduced-motion support. Keep page content within `min(100%, 430px)` and center it on wider displays.

- [ ] **Step 4: Verify and commit**

Run: `npx playwright test tests/e2e/mobile-layout.spec.ts`

Expected: PASS at all three viewports with no overflow.

```powershell
git add src tests/e2e/mobile-layout.spec.ts
git commit -m "style: match mobile bookkeeping reference"
```

### Task 9: Verify full workflows, PWA, and production build

**Files:**
- Create: `tests/e2e/bookkeeping-flow.spec.ts`, `tests/e2e/backup-flow.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Add end-to-end workflows**

Test adding an expense with two images, immediate previews, refresh persistence, gallery navigation, month/year statistics, deletion, ZIP export/import, and offline reload after first online visit.

- [ ] **Step 2: Run the complete verification suite**

Run:

```powershell
npm test -- --run
npm run build
npx playwright test
```

Expected: all unit/E2E tests pass and production build succeeds without TypeScript or PWA errors.

- [ ] **Step 3: Inspect production output and mobile screenshots**

Run: `npm run preview -- --host 0.0.0.0`

Expected: phone on the same LAN can open the shown HTTPS-capable deployment URL; installed PWA opens standalone, records/images persist, and cached app shell reopens offline.

- [ ] **Step 4: Document use and deployment**

README must include install/build commands, HTTPS deployment requirement, phone installation steps, local-only data warning, ZIP backup instructions, supported browsers, and storage limitations.

- [ ] **Step 5: Final commit**

```powershell
git add README.md tests/e2e
git commit -m "test: verify mobile bookkeeping workflows"
git status --short
```

Expected: clean working tree.
