import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DateTimePickerSheet from '../../src/shared/components/DateTimePickerSheet.vue'

describe('DateTimePickerSheet', () => {
  it('selects a date, hour, and individual minute', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07', title: '选择记账时间' } })
    await wrapper.get('[data-day="20"]').trigger('click')
    await wrapper.get('[data-action="toggle-time"]').trigger('click')
    await wrapper.get('[data-hour="14"]').trigger('click')
    await wrapper.get('[data-minute="43"]').trigger('click')
    await wrapper.get('[data-action="confirm"]').trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual(['2026-08-20T14:43'])
  })

  it('keeps the time wheels hidden until the time row is opened', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07' } })

    expect(wrapper.findAll('[data-hour]')).toHaveLength(0)
    expect(wrapper.findAll('[data-minute]')).toHaveLength(0)

    await wrapper.get('[data-action="toggle-time"]').trigger('click')

    expect(wrapper.findAll('[data-hour]')).toHaveLength(24)
    expect(wrapper.findAll('[data-minute]')).toHaveLength(60)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('cancels without selecting a new value', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07' } })

    await wrapper.get('[data-action="cancel"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
