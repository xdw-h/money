import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RecordEditor from '../../src/features/records/RecordEditor.vue'

describe('RecordEditor', () => {
  it('enters cents with the keypad and emits a complete draft', async () => {
    const wrapper = mount(RecordEditor, { global: { stubs: { ImageUploader: true } } })
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
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('loads an existing record for editing', () => {
    const wrapper = mount(RecordEditor, {
      props: { initial: { type: 'expense', amount: 12800, categoryId: 'food', occurredAt: '2026-08-15T08:30:00.000Z', note: '晚餐', imageIds: [] } },
      global: { stubs: { ImageUploader: true } },
    })
    expect(wrapper.get('[data-testid="amount"]').text()).toContain('¥128.00')
    expect(wrapper.get<HTMLTextAreaElement>('textarea').element.value).toBe('晚餐')
  })
})
