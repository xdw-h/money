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

  it('keeps custom picker sheets inside narrow viewports', () => {
    for (const file of ['src/shared/components/DatePickerSheet.vue', 'src/shared/components/MonthPickerSheet.vue', 'src/shared/components/DateTimePickerSheet.vue']) {
      expect(readFileSync(file, 'utf8')).toContain('box-sizing:border-box')
    }
    expect(readFileSync('src/shared/components/DateTimePickerSheet.vue', 'utf8')).toContain('overflow-x:hidden')
  })
})
