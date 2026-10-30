import 'fake-indexeddb/auto'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import SavingsPage from '../../src/pages/SavingsPage.vue'
import { db } from '../../src/shared/db/database'

afterEach(async () => { await db.savingsDeposits.clear(); await db.savingsPlans.clear() })
it('creates a plan and lets a deposit differ from the default amount', async () => {
  const wrapper = mount(SavingsPage, { global: { stubs: { RouterLink: true, teleport: true } } })
  await flushPromises()
  await wrapper.get('[data-action="create-plan"]').trigger('click')
  await wrapper.get('input[aria-label="计划名称"]').setValue('环游世界')
  await wrapper.get('input[aria-label="目标金额"]').setValue('1000')
  await wrapper.get('input[aria-label="每次默认存入"]').setValue('100')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.find('.plan-name').text()).toBe('环游世界'))
  await wrapper.get('[data-action="deposit"]').trigger('click')
  expect((wrapper.get('input[aria-label="存入金额"]').element as HTMLInputElement).value).toBe('100')
  await wrapper.get('input[aria-label="存入金额"]').setValue('50')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('5%'))
  expect(wrapper.text()).toContain('¥50.00')
  wrapper.unmount()
})
