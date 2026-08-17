import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmojiPickerField from '../../src/shared/components/EmojiPickerField.vue'

describe('EmojiPickerField', () => {
  it('opens the curated icon library and emits the selected icon', async () => {
    const wrapper = mount(EmojiPickerField, { props: { modelValue: '📒', label: '账本图标' } })
    await wrapper.get('button[aria-label="选择账本图标"]') .trigger('click')
    expect(wrapper.text()).toContain('常用记账图标')
    await wrapper.get('button[aria-label="选择图标 💰"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['💰'])
  })
})
