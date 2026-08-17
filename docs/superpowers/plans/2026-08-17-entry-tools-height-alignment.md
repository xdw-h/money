# Entry Tools Height Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the note, date, and photo controls to the same 38px height without changing their widths or behavior.

**Architecture:** Keep the existing three-column grid. Make the image uploader fill and center within its grid cell, then apply the shared 38px height to its preview grid, tiles, and thumbnails.

**Tech Stack:** Vue 3 scoped CSS, Playwright

---

### Task 1: Verify and align the three controls

**Files:**
- Modify: `src/features/records/RecordEditor.vue`
- Modify: `src/features/images/ImageUploader.vue`
- Test: `tests/e2e/mobile-layout.spec.ts`

- [ ] **Step 1: Add the failing browser assertion**

On `/record/new`, measure `.note-trigger`, `.date-field`, and `.upload-tile`. Assert each height is `38` and the difference between their top positions is at most one pixel.

- [ ] **Step 2: Verify the assertion fails**

Run: `rtk npx playwright test tests/e2e/mobile-layout.spec.ts`

Expected: FAIL because the image uploader does not explicitly fill and align its grid cell.

- [ ] **Step 3: Apply the minimal CSS alignment**

Set the editor's image uploader and preview grid to `height:38px;align-self:center`. Set uploader figures and `.upload-tile` to `height:38px`, preserving their current width and border radius.

- [ ] **Step 4: Verify the regression and build**

Run: `rtk npx playwright test tests/e2e/mobile-layout.spec.ts`

Run: `rtk npm run build`

Expected: mobile layout tests pass and production build exits successfully.
