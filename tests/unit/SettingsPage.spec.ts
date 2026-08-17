import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPage from '../../src/pages/SettingsPage.vue'

const storageMocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  request: vi.fn(),
}))
const ledgerMocks = vi.hoisted(() => ({ addLedger: vi.fn(), updateLedger: vi.fn() }))

vi.mock('../../src/features/storage/storageProtection', () => ({
  formatBytes: (value: number | null) => value === null ? '-' : `${value} B`,
  getStorageProtectionStatus: storageMocks.getStatus,
  requestStorageProtection: storageMocks.request,
}))

vi.mock('../../src/features/ledgers/ledgerStore', async () => {
  const { ref } = await import('vue')
  return {
    activeLedgerId: ref('ledger-1'),
    ledgerItems: ref([]),
    addLedger: ledgerMocks.addLedger,
    deleteLedger: vi.fn(),
    loadLedgers: vi.fn(),
    setActiveLedger: vi.fn(),
    updateLedger: ledgerMocks.updateLedger,
  }
})

describe('SettingsPage storage protection', () => {
  beforeEach(() => {
    ledgerMocks.addLedger.mockReset().mockResolvedValue(undefined)
    ledgerMocks.updateLedger.mockReset().mockResolvedValue(undefined)
    storageMocks.getStatus.mockReset().mockResolvedValue({
      supported: true,
      persisted: false,
      usage: 2048,
      quota: 8192,
    })
    storageMocks.request.mockReset().mockResolvedValue({
      supported: true,
      persisted: false,
      usage: 2048,
      quota: 8192,
    })
  })

  it('automatically requests protection and shows quota with a retry action', async () => {
    const wrapper = mount(SettingsPage)
    await flushPromises()

    expect(storageMocks.request).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('存储保护')
    expect(wrapper.text()).toContain('未保护')
    expect(wrapper.text()).toContain('已用 2048 B / 配额 8192 B')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('25')
    await wrapper.get('button[aria-label="重新申请存储保护"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('浏览器暂未批准')
  })

  it('creates a ledger with a selectable emoji icon', async () => {
    const wrapper = mount(SettingsPage, {
      global: { stubs: { EmojiPickerField: { props: ['modelValue', 'label'], template: '<button class="emoji-stub" @click="$emit(\'update:modelValue\', \'🚀\')">{{ label }}</button>' } } },
    })
    await flushPromises()
    await wrapper.get('.add-ledger').trigger('click')

    expect(wrapper.text()).toContain('新增账本')
    await wrapper.get('.emoji-stub').trigger('click')
    await wrapper.get('input[aria-label="账本名称"]').setValue('旅行账本')
    await wrapper.get('button[aria-label="保存账本"]').trigger('click')

    expect(ledgerMocks.addLedger).toHaveBeenCalledWith('旅行账本', '🚀')
  })

  it('provides app lock and release notes settings', async () => {
    const wrapper = mount(SettingsPage, { global: { stubs: { AppLockSetupSheet: true, ReleaseNotesSheet: true } } })
    await flushPromises()
    expect(wrapper.get('button[aria-label="应用锁设置"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="查看版本公告"]')).toBeTruthy()
  })
})
