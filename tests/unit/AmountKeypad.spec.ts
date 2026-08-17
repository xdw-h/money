import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AmountKeypad from '../../src/features/records/AmountKeypad.vue'

describe('AmountKeypad', () => {
  it('uses the reference four-column, four-row key layout', async () => {
    const wrapper = mount(AmountKeypad)
    expect(wrapper.findAll('button')).toHaveLength(16)
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      '1', '2', '3', '⌫', '4', '5', '6', '−', '7', '8', '9', '+', '', '0', '.', '保存',
    ])
    expect(wrapper.get('[data-key="blank"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-key="8"]').trigger('click')
    expect(wrapper.emitted('key')?.[0]).toEqual(['8'])
  })

  it('emits save separately from amount keys', async () => {
    const wrapper = mount(AmountKeypad)
    await wrapper.get('[data-key="save"]').trigger('click')
    expect(wrapper.emitted('save')).toHaveLength(1)
    expect(wrapper.emitted('key')).toBeUndefined()
  })
})
