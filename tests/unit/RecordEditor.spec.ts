import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RecordEditor from '../../src/features/records/RecordEditor.vue'
import DateTimePickerSheet from '../../src/shared/components/DateTimePickerSheet.vue'
import type { RecordDraft } from '../../src/features/records/types'

describe('RecordEditor', () => {
  it('enters cents with the keypad and emits a complete draft', async () => {
    const wrapper = mount(RecordEditor, { global: { stubs: { ImageUploader: true } } })
    expect(wrapper.get('.entry-tools').find('.note-trigger').exists()).toBe(true)
    expect(wrapper.get('.entry-tools').find('[aria-label="选择记账时间"]').exists()).toBe(true)
    expect(wrapper.find('input[type="datetime-local"]').exists()).toBe(false)
    expect(wrapper.get('.entry-tools').find('image-uploader-stub').exists()).toBe(true)
    await wrapper.get('.note-trigger').trigger('click')
    expect(wrapper.get('textarea[aria-label="备注"]')).toBeTruthy()
    await wrapper.get('[data-key="2"]').trigger('click')
    await wrapper.get('[data-key="4"]').trigger('click')
    await wrapper.get('[data-key="0"]').trigger('click')
    expect(wrapper.get('[data-testid="amount"]').text()).toContain('¥240.00')
    await wrapper.get('[data-category="food"]').trigger('click')
    await wrapper.get('textarea').setValue('晚餐')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      type: 'expense', amount: 24000, categoryId: 'food', note: '晚餐',
    })
  })

  it('switches to income and prevents a zero-value save', async () => {
    const wrapper = mount(RecordEditor, { global: { stubs: { ImageUploader: true } } })
    await wrapper.get('[data-type="income"]').trigger('click')
    expect(wrapper.get('[data-type="income"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('.category-grid').classes()).toContain('income-grid')
    expect(wrapper.find('.category-grid .add-category').exists()).toBe(false)
    expect(wrapper.get('[data-key="save"]').attributes('disabled')).toBeDefined()
  })

  it('calculates with the keypad and saves from its bottom-right key', async () => {
    const wrapper = mount(RecordEditor, { global: { stubs: { ImageUploader: true } } })
    await wrapper.get('[data-key="1"]').trigger('click')
    await wrapper.get('[data-key="0"]').trigger('click')
    await wrapper.get('[data-key="+"]').trigger('click')
    await wrapper.get('[data-key="5"]').trigger('click')
    await wrapper.get('[data-key="save"]').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ amount: 1500 })
    expect(wrapper.find('.save-button').exists()).toBe(false)
  })

  it('loads an existing record for editing', () => {
    const wrapper = mount(RecordEditor, {
      props: { initial: { type: 'expense', amount: 12800, categoryId: 'food', occurredAt: '2026-08-15T08:30:00.000Z', note: '晚餐', imageIds: [] } },
      global: { stubs: { ImageUploader: true } },
    })
    expect(wrapper.get('[data-testid="amount"]').text()).toContain('¥128.00')
    expect(wrapper.get('.note-trigger').text()).toContain('晚餐')
  })

  it('saves a record with a historical local date', async () => {
    const wrapper = mount(RecordEditor, { global: { stubs: { ImageUploader: true } } })
    await wrapper.get('[aria-label="选择记账时间"]').trigger('click')
    wrapper.getComponent(DateTimePickerSheet).vm.$emit('select', '2024-03-15T08:30')
    await wrapper.vm.$nextTick()
    await wrapper.get('[data-key="1"]').trigger('click')
    await wrapper.get('form').trigger('submit')

    const saved = wrapper.emitted('save')?.[0]?.[0] as RecordDraft | undefined
    expect(saved).toBeDefined()
    const savedDate = new Date(saved!.occurredAt)
    expect(savedDate.getFullYear()).toBe(2024)
    expect(savedDate.getMonth()).toBe(2)
    expect(savedDate.getDate()).toBe(15)
    expect(savedDate.getHours()).toBe(8)
    expect(savedDate.getMinutes()).toBe(30)
  })

  it('keeps existing image ids when saving an edited record', async () => {
    const wrapper = mount(RecordEditor, {
      props: { initial: { type: 'expense', amount: 12800, categoryId: 'food', occurredAt: '2026-08-15T08:30:00.000Z', note: '晚餐', imageIds: ['image-1'] } },
      global: { stubs: { ImageUploader: true } },
    })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ imageIds: ['image-1'] })
  })
})
