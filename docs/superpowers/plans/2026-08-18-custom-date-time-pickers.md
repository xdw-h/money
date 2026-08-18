# Custom Date Time Pickers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every native date, month, and datetime input with project-styled custom picker sheets while preserving existing stored values and statistics.

**Architecture:** Keep calendar-only behavior in the existing `DatePickerSheet`, add focused month and datetime sheets, and let each page own only its open/close state and selected string. Picker components emit `YYYY-MM`, `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm`; existing page and repository conversion logic remains responsible for persistence.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vitest, Vue Test Utils, CSS custom properties.

---

## File structure

- Create `src/shared/components/MonthPickerSheet.vue`: reusable year navigation and twelve-month grid.
- Create `src/shared/components/DateTimePickerSheet.vue`: reusable calendar plus custom hour/minute button lists.
- Create `tests/unit/MonthPickerSheet.spec.ts`: month selection behavior.
- Create `tests/unit/DateTimePickerSheet.spec.ts`: date and one-minute time selection behavior.
- Create `tests/unit/customDateControls.spec.ts`: source-level regression preventing native date controls.
- Modify `src/pages/SettingsPage.vue`: explicit custom date/month buttons; remove native-input interception.
- Modify `src/pages/BillsPage.vue`: custom month button and sheet.
- Modify `src/features/records/RecordEditor.vue`: custom datetime button and sheet.
- Modify `tests/unit/SettingsPage.spec.ts`: verify the custom month/date triggers.
- Modify `tests/unit/RecordEditor.spec.ts`: verify custom datetime selection and saved timestamp.

### Task 1: Custom month picker

**Files:**
- Create: `tests/unit/MonthPickerSheet.spec.ts`
- Create: `src/shared/components/MonthPickerSheet.vue`

- [ ] **Step 1: Write the failing component test**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MonthPickerSheet from '../../src/shared/components/MonthPickerSheet.vue'

describe('MonthPickerSheet', () => {
  it('changes year and emits the selected month', async () => {
    const wrapper = mount(MonthPickerSheet, { props: { modelValue: '2026-08', title: '选择月份' } })
    await wrapper.get('[aria-label="下一年"]').trigger('click')
    await wrapper.get('[data-month="03"]').trigger('click')
    await wrapper.get('[data-action="confirm"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['2027-03'])
  })

  it('closes without emitting a selection', async () => {
    const wrapper = mount(MonthPickerSheet, { props: { modelValue: '2026-08' } })
    await wrapper.get('[aria-label="关闭月份选择"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `"C:\Program Files\nodejs\node.exe" node_modules/vitest/vitest.mjs --run tests/unit/MonthPickerSheet.spec.ts`

Expected: FAIL because `MonthPickerSheet.vue` does not exist.

- [ ] **Step 3: Implement the focused month sheet**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ modelValue: string; title?: string }>()
const emit = defineEmits<{ close: []; select: [value: string] }>()
const [initialYear, initialMonth] = props.modelValue.split('-').map(Number)
const year = ref(initialYear)
const month = ref(initialMonth)
const selected = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`)
function moveYear(offset: number) { year.value += offset }
</script>

<template>
  <div class="picker-overlay" @click.self="emit('close')">
    <section class="month-picker-sheet" role="dialog" aria-modal="true" :aria-label="title || '选择月份'">
      <header><div><strong>{{ title || '选择月份' }}</strong><small>{{ selected }}</small></div><button type="button" aria-label="关闭月份选择" @click="emit('close')">×</button></header>
      <div class="year-nav"><button type="button" aria-label="上一年" @click="moveYear(-1)">‹</button><b>{{ year }}年</b><button type="button" aria-label="下一年" @click="moveYear(1)">›</button></div>
      <div class="months"><button v-for="value in 12" :key="value" type="button" :data-month="String(value).padStart(2, '0')" :class="{selected:month===value}" @click="month=value">{{ value }}月</button></div>
      <button class="confirm" data-action="confirm" type="button" @click="emit('select', selected)">确定：{{ selected }}</button>
    </section>
  </div>
</template>
```

Add scoped styling matching `DatePickerSheet`: bottom overlay, theme variables, 3×4 month grid, 44-pixel minimum buttons, selected primary background, and safe-area bottom padding.

- [ ] **Step 4: Run the component test and verify GREEN**

Run the Step 2 command. Expected: 2 tests PASS.

- [ ] **Step 5: Commit the month picker**

```powershell
git add src/shared/components/MonthPickerSheet.vue tests/unit/MonthPickerSheet.spec.ts
git commit -m "feat: add custom month picker"
```

### Task 2: Custom one-minute datetime picker

**Files:**
- Create: `tests/unit/DateTimePickerSheet.spec.ts`
- Create: `src/shared/components/DateTimePickerSheet.vue`

- [ ] **Step 1: Write the failing datetime tests**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DateTimePickerSheet from '../../src/shared/components/DateTimePickerSheet.vue'

describe('DateTimePickerSheet', () => {
  it('selects a date, hour, and individual minute', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07', title: '选择记账时间' } })
    await wrapper.get('[data-day="20"]').trigger('click')
    await wrapper.get('[data-hour="14"]').trigger('click')
    await wrapper.get('[data-minute="43"]').trigger('click')
    await wrapper.get('[data-action="confirm"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['2026-08-20T14:43'])
  })

  it('exposes all 60 minute choices without native time inputs', () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07' } })
    expect(wrapper.findAll('[data-minute]')).toHaveLength(60)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('select').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `"C:\Program Files\nodejs\node.exe" node_modules/vitest/vitest.mjs --run tests/unit/DateTimePickerSheet.spec.ts`

Expected: FAIL because `DateTimePickerSheet.vue` does not exist.

- [ ] **Step 3: Implement datetime state and emitted value**

```ts
const [initialDate, initialTime = '00:00'] = props.modelValue.split('T')
const selectedDate = ref(initialDate)
const visibleMonth = ref(initialDate.slice(0, 7))
const [initialHour, initialMinute] = initialTime.split(':').map(Number)
const hour = ref(initialHour)
const minute = ref(initialMinute)
const hours = Array.from({ length: 24 }, (_, index) => index)
const minutes = Array.from({ length: 60 }, (_, index) => index)
const selected = computed(() => `${selectedDate.value}T${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`)
```

Build the calendar using the same `monthKey`, `moveMonth`, `dateKey`, and `days` rules as `DatePickerSheet`. Render hour and minute as two scrollable button columns using `data-hour` and `data-minute`; do not use `input` or `select`. Confirm emits `selected`; close and overlay dismiss without emitting.

- [ ] **Step 4: Run the datetime tests and verify GREEN**

Run the Step 2 command. Expected: 2 tests PASS.

- [ ] **Step 5: Commit the datetime picker**

```powershell
git add src/shared/components/DateTimePickerSheet.vue tests/unit/DateTimePickerSheet.spec.ts
git commit -m "feat: add custom datetime picker"
```

### Task 3: Replace settings native date and month controls

**Files:**
- Modify: `src/pages/SettingsPage.vue:13-73,131-135`
- Modify: `tests/unit/SettingsPage.spec.ts`

- [ ] **Step 1: Add failing settings assertions**

After opening `账期设置`, assert there are no `input[type="date"]` or `input[type="month"]` elements. Click `日常账本选择账期月份`, assert `MonthPickerSheet` is visible, select `2027-03`, and assert the displayed month becomes `2027年3月`.

```ts
expect(wrapper.find('input[type="date"]').exists()).toBe(false)
expect(wrapper.find('input[type="month"]').exists()).toBe(false)
await wrapper.get('[aria-label="日常账本选择账期月份"]').trigger('click')
expect(wrapper.get('[aria-label="选择账期月份"]').exists()).toBe(true)
```

- [ ] **Step 2: Run the settings test and verify RED**

Run: `"C:\Program Files\nodejs\node.exe" node_modules/vitest/vitest.mjs --run tests/unit/SettingsPage.spec.ts`

Expected: FAIL because native inputs remain and the custom month sheet is absent.

- [ ] **Step 3: Replace interception with explicit buttons**

Import `MonthPickerSheet`. Remove `forwardDateChange`, `openCustomDatePicker(event)`, and the `@click.capture`/`@change.capture` handlers. Add:

```ts
const monthPicker = ref<{ ledgerId: string; value: string } | null>(null)
function openDatePicker(kind: 'anchor' | 'start' | 'end', value: string, min?: string) {
  const title = kind === 'end' ? '选择该期终止日' : kind === 'anchor' ? '选择默认起始日' : '选择该期起始日'
  datePicker.value = { kind, value, min, title }
}
function applyCustomMonth(value: string) {
  const picker = monthPicker.value
  if (!picker) return
  setSelectedCycleMonth(picker.ledgerId, value)
  monthPicker.value = null
}
```

Replace each native date input with a button that calls `openDatePicker`; replace the native month input with a button that sets `monthPicker`. Mount `MonthPickerSheet` next to `DatePickerSheet` and include both sheets in body-scroll locking.

- [ ] **Step 4: Run settings tests and verify GREEN**

Run the Step 2 command. Expected: all settings tests PASS.

- [ ] **Step 5: Commit settings integration**

```powershell
git add src/pages/SettingsPage.vue tests/unit/SettingsPage.spec.ts
git commit -m "feat: use custom billing date controls"
```

### Task 4: Replace the bills month control

**Files:**
- Modify: `src/pages/BillsPage.vue:2-54`
- Create: `tests/unit/BillsPage.spec.ts`

- [ ] **Step 1: Write a failing page test**

Mount `BillsPage` with the database, chart, recent-list, and router dependencies stubbed. Assert there is no `input[type="month"]`; click the `选择月份` button; emit `select` with `2025-11`; assert the button displays `2025年11月` and the billing range recomputes.

- [ ] **Step 2: Run the page test and verify RED**

Run: `"C:\Program Files\nodejs\node.exe" node_modules/vitest/vitest.mjs --run tests/unit/BillsPage.spec.ts`

Expected: FAIL because the page still contains a native month input.

- [ ] **Step 3: Integrate `MonthPickerSheet`**

```ts
import MonthPickerSheet from '../shared/components/MonthPickerSheet.vue'
import { useBodyScrollLock } from '../shared/ui/useBodyScrollLock'
const monthPickerOpen = ref(false)
const monthLabel = computed(() => {
  const [year, month] = monthValue.value.split('-').map(Number)
  return `${year}年${month}月`
})
useBodyScrollLock(monthPickerOpen)
function selectMonth(value: string) { monthValue.value = value; monthPickerOpen.value = false }
```

Replace the native month input with `<button type="button" aria-label="选择月份" @click="monthPickerOpen=true">{{ monthLabel }}</button>` and mount `MonthPickerSheet` with `model-value="monthValue"`, `@close`, and `@select="selectMonth"`.

- [ ] **Step 4: Run the bills test and verify GREEN**

Run the Step 2 command. Expected: page test PASS.

- [ ] **Step 5: Commit bills integration**

```powershell
git add src/pages/BillsPage.vue tests/unit/BillsPage.spec.ts
git commit -m "feat: use custom bill month picker"
```

### Task 5: Replace the record datetime control

**Files:**
- Modify: `src/features/records/RecordEditor.vue:2-39,105-150,187-212`
- Modify: `tests/unit/RecordEditor.spec.ts`

- [ ] **Step 1: Change existing tests to require the custom sheet**

Replace the native-input assertion with a button assertion. Open the sheet, emit `2024-03-15T08:30`, save, and retain the existing assertions that the stored instant converts back to local 2024-03-15 08:30.

```ts
expect(wrapper.find('input[type="datetime-local"]').exists()).toBe(false)
await wrapper.get('[aria-label="选择记账时间"]').trigger('click')
wrapper.getComponent(DateTimePickerSheet).vm.$emit('select', '2024-03-15T08:30')
```

- [ ] **Step 2: Run the record editor test and verify RED**

Run: `"C:\Program Files\nodejs\node.exe" node_modules/vitest/vitest.mjs --run tests/unit/RecordEditor.spec.ts`

Expected: FAIL because the native datetime input remains.

- [ ] **Step 3: Integrate the custom datetime sheet**

Import `DateTimePickerSheet`, add `dateTimeSheetOpen`, include it in `useBodyScrollLock`, and add:

```ts
function selectOccurredAt(value: string) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) occurredAt.value = value
  dateTimeSheetOpen.value = false
}
```

Replace the label/input with a button using `aria-label="选择记账时间"`. Mount `DateTimePickerSheet` with `model-value="occurredAt"`, `@close`, and `@select="selectOccurredAt"`. Keep the existing `new Date(occurredAt.value).toISOString()` persistence conversion.

- [ ] **Step 4: Run the record editor tests and verify GREEN**

Run the Step 2 command. Expected: all record editor tests PASS.

- [ ] **Step 5: Commit record integration**

```powershell
git add src/features/records/RecordEditor.vue tests/unit/RecordEditor.spec.ts
git commit -m "feat: use custom record datetime picker"
```

### Task 6: Native-control guard and full verification

**Files:**
- Create: `tests/unit/customDateControls.spec.ts`

- [ ] **Step 1: Write the source guard**

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const files = [
  'src/features/records/RecordEditor.vue',
  'src/pages/BillsPage.vue',
  'src/pages/SettingsPage.vue',
]

describe('custom date controls', () => {
  it('does not use native date, month, or datetime-local inputs', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toMatch(/type=["'](?:date|month|datetime-local)["']/)
    }
  })
})
```

- [ ] **Step 2: Run focused picker and page tests**

Run: `"C:\Program Files\nodejs\node.exe" node_modules/vitest/vitest.mjs --run tests/unit/MonthPickerSheet.spec.ts tests/unit/DateTimePickerSheet.spec.ts tests/unit/customDateControls.spec.ts tests/unit/SettingsPage.spec.ts tests/unit/BillsPage.spec.ts tests/unit/RecordEditor.spec.ts`

Expected: all focused tests PASS with no warnings.

- [ ] **Step 3: Run full tests and production build**

```powershell
"C:\Program Files\nodejs\node.exe" node_modules/vitest/vitest.mjs --run
"C:\Program Files\nodejs\node.exe" scripts/validate-release-notes.mjs
"C:\Program Files\nodejs\node.exe" node_modules/vue-tsc/bin/vue-tsc.js -b
"C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js build
"C:\Program Files\nodejs\node.exe" scripts/stamp-service-worker.mjs
```

Expected: all tests pass, type check exits 0, and Vite reports a successful production build.

- [ ] **Step 4: Verify in the in-app browser**

At an iPhone-sized viewport, open each of: record datetime, bill month, settings cycle month, anchor date, cycle start, and cycle end. Confirm every entry opens a project-styled bottom sheet, every selected value remains after closing, and no system picker appears.

- [ ] **Step 5: Commit the guard and any final styling corrections**

```powershell
git add tests/unit/customDateControls.spec.ts src/shared/components src/pages/BillsPage.vue src/pages/SettingsPage.vue src/features/records/RecordEditor.vue tests/unit
git commit -m "test: guard custom date controls"
```
