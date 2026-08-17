import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AmountKeypad from '../../src/features/records/AmountKeypad.vue'

describe('AmountKeypad', () => {
  it('uses a compact four-column, three-row key layout', async () => {
    const wrapper = mount(AmountKeypad)
    expect(wrapper.findAll('button')).toHaveLength(12)
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      '1', '2', '3', '⌫', '4', '5', '6', '.', '7', '8', '9', '0',
    ])
    await wrapper.get('[data-key="8"]').trigger('click')
    expect(wrapper.emitted('key')?.[0]).toEqual(['8'])
  })
})
