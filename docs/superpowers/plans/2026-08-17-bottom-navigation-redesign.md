# Bottom Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current split CSS bottom navigation silhouette with the approved high-fidelity continuous outline while preserving all routes and accessibility behavior.

**Architecture:** `App.vue` owns the semantic navigation and inline SVG artwork. One responsive SVG path draws the complete panel silhouette, while `base.css` positions the artwork and navigation controls. Existing router active classes continue to drive colors and the active indicator.

**Tech Stack:** Vue 3, Vue Router, CSS, inline SVG, Vitest, Playwright

---

### Task 1: Lock the navigation contract with a unit test

**Files:**
- Modify: `tests/unit/app-shell.spec.ts`
- Test: `tests/unit/app-shell.spec.ts`

- [ ] **Step 1: Write the failing assertions**

Add assertions that the rendered navigation contains one `.bottom-nav__outline` SVG path, four `.bottom-nav__icon` elements, the existing five accessible links, and no generated `data-icon` attributes.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- --run tests/unit/app-shell.spec.ts`

Expected: FAIL because the continuous outline and SVG icon classes do not exist yet.

- [ ] **Step 3: Preserve the failure output for implementation guidance**

Confirm failures are limited to the new structural assertions; existing route and hidden-navigation assertions must remain green.

### Task 2: Implement the continuous SVG navigation

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/base.css`
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Add the single responsive silhouette path**

Add an `aria-hidden="true"` SVG behind the links with a `viewBox="0 0 430 128"` and one path covering the full left edge, top edge, central cubic Bézier arch, right edge, bottom edge, and rounded corners.

- [ ] **Step 2: Replace font symbols with inline SVG icons**

Render home, bill, clock, and settings as `24 × 24` view-box SVGs using `currentColor`, round caps, round joins, and consistent stroke width. Keep the central link's `aria-label="新增记账"`.

- [ ] **Step 3: Implement approved proportions and visual tokens**

Set the `430px` baseline to a `61px` panel body, approximately `104px` arch width, `66px` central button, purple gradient, white ring, lavender border, and soft purple shadow. Retain safe-area padding and increase `.app-shell` bottom padding so content stays visible.

- [ ] **Step 4: Implement interaction states**

Use `.router-link-active` for purple icon/text color and a rounded underline; add a visible `:focus-visible` outline and keep reduced-motion behavior unchanged.

- [ ] **Step 5: Run the focused unit test**

Run: `npm test -- --run tests/unit/app-shell.spec.ts`

Expected: PASS.

### Task 3: Verify responsive rendering and regressions

**Files:**
- Modify: `tests/e2e/mobile-layout.spec.ts`
- Test: `tests/e2e/mobile-layout.spec.ts`

- [ ] **Step 1: Add responsive layout checks**

At `390 × 844` and `430 × 932`, assert the navigation and central action are visible, the document has no horizontal overflow, and the navigation outline remains within the viewport.

- [ ] **Step 2: Run the mobile layout test**

Run: `npx playwright test tests/e2e/mobile-layout.spec.ts`

Expected: PASS at both viewports.

- [ ] **Step 3: Run the full verification suite**

Run: `npm test -- --run && npm run build`

Expected: all unit tests pass and the production build completes without TypeScript or bundling errors.

- [ ] **Step 4: Perform visual checks**

Capture the home page at `390px` and `430px`; verify the arch shoulder has no seam or doubled border, all four icons share one stroke style, and the active underline is centered.

### Task 4: Commit the isolated implementation

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/base.css`
- Modify: `src/styles/tokens.css`
- Modify: `tests/unit/app-shell.spec.ts`
- Modify: `tests/e2e/mobile-layout.spec.ts`

- [ ] **Step 1: Inspect the final diff**

Run: `git diff --check` and confirm no unrelated user changes are staged.

- [ ] **Step 2: Commit only isolated navigation changes**

Run: `git commit -m "feat: redesign bottom navigation"` only if the navigation hunks can be staged without including pre-existing edits; otherwise leave the verified implementation uncommitted and report the overlap.
