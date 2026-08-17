import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmojiPickerField from '../../src/shared/components/EmojiPickerField.vue'

vi.mock('emoji-picker-element/picker', () => {
  class FakePicker extends HTMLElement {}
  if (!customElements.get('emoji-picker')) customElements.define('emoji-picker', FakePicker)
  return { default: FakePicker }
})

describe('EmojiPickerField', () => {
  it('opens the full picker and emits the selected emoji', async () => {
    const wrapper = mount(EmojiPickerField, { props: { modelValue: '📒', label: '账本图标' } })
    await wrapper.get('button[aria-label="选择账本图标"]') .trigger('click')
    await vi.dynamicImportSettled()

    const picker = wrapper.element.querySelector('emoji-picker') as HTMLElement
    expect(picker).toBeTruthy()
    picker.dispatchEvent(new CustomEvent('emoji-click', { detail: { unicode: '🚀' } }))

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['🚀'])
  })
})
