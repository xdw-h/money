import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DateTimePickerSheet from '../../src/shared/components/DateTimePickerSheet.vue'

describe('DateTimePickerSheet', () => {
  it('keeps a fixed six-row calendar grid across months', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07' } })

    expect(wrapper.findAll('[data-calendar-cell]')).toHaveLength(42)
    await wrapper.get('[aria-label="下个月"]').trigger('click')
    expect(wrapper.findAll('[data-calendar-cell]')).toHaveLength(42)
  })

  it('opens fast year and month wheels without changing the selected date', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07' } })

    await wrapper.get('[data-action="toggle-month-picker"]').trigger('click')
    expect(wrapper.find('[aria-label="选择年份和月份"]').exists()).toBe(true)
    await wrapper.get('[data-year="2028"]').trigger('click')
    await wrapper.get('[data-month="3"]').trigger('click')

    expect(wrapper.get('[data-action="toggle-month-picker"]').text()).toContain('2028年3月')
    expect(wrapper.find('[aria-label="选择年份和月份"]').exists()).toBe(false)
    await wrapper.get('[data-action="confirm"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['2026-08-18T09:07'])
  })

  it('moves across year boundaries with month navigation', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-01-18T09:07' } })

    await wrapper.get('[aria-label="上个月"]').trigger('click')

    expect(wrapper.get('[data-action="toggle-month-picker"]').text()).toContain('2025年12月')
  })

  it('selects a date, hour, and individual minute', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07', title: '选择记账时间' } })
    await wrapper.get('[data-day="20"]').trigger('click')
    await wrapper.get('[data-action="toggle-time"]').trigger('click')
    await wrapper.get('[data-hour="14"]').trigger('click')
    expect(wrapper.get('[data-action="toggle-time"]').text()).toContain('14:07')
    await wrapper.get('[data-minute="43"]').trigger('click')
    expect(wrapper.find('[aria-label="选择时间"]').exists()).toBe(false)
    expect(wrapper.get('[data-action="toggle-time"]').text()).toContain('已选择 14:43')
    await wrapper.get('[data-action="confirm"]').trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual(['2026-08-20T14:43'])
  })

  it('updates the displayed time while the fixed wheels scroll', async () => {
    const wrapper = mount(DateTimePickerSheet, { props: { modelValue: '2026-08-18T09:07' } })
    await wrapper.get('[data-action="toggle-time"]').trigger('click')
    const hourList = wrapper.get('[aria-label="选择小时"]')
    Object.defineProperty(hourList.element, 'scrollTop', { configurable: true, value: 14 * 36 })
    await hourList.trigger('scroll')

    expect(wrapper.get('[data-action="toggle-time"]').text()).toContain('14:07')
    expect(wrapper.find('[data-selection-band]').exists()).toBe(true)
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
