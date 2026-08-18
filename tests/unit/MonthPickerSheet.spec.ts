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
