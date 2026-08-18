import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import BillsPage from '../../src/pages/BillsPage.vue'
import MonthPickerSheet from '../../src/shared/components/MonthPickerSheet.vue'

vi.mock('../../src/shared/db/database', () => ({
  db: {
    records: { where: () => ({ equals: () => ({ reverse: () => ({ sortBy: () => Promise.resolve([]) }) }) }) },
    images: { where: () => ({ anyOf: () => ({ toArray: () => Promise.resolve([]) }) }) },
  },
}))
vi.mock('../../src/features/records/categoryStore', () => ({ categoryItems: ref([]), loadCategories: vi.fn() }))
vi.mock('../../src/features/ledgers/ledgerStore', () => ({
  activeLedger: ref({ id: 'ledger-1', name: '日常账本', icon: '📒', cycleAnchorDate: '2026-08-01', createdAt: '' }),
  activeLedgerId: ref('ledger-1'),
  loadLedgers: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('BillsPage custom month picker', () => {
  it('selects a month without a native month input', async () => {
    const wrapper = mount(BillsPage, { global: { stubs: { TrendChart: true, RecentRecordList: true } } })
    await flushPromises()

    expect(wrapper.find('input[type="month"]').exists()).toBe(false)
    await wrapper.get('button[aria-label="选择月份"]').trigger('click')
    wrapper.getComponent(MonthPickerSheet).vm.$emit('select', '2025-11')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('button[aria-label="选择月份"]').text()).toContain('2025年11月')
  })
})
