import { webcrypto } from 'node:crypto'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppLockSetupSheet from '../../src/features/appLock/AppLockSetupSheet.vue'
import { getAppLockType } from '../../src/features/appLock/appLockStore'

describe('AppLockSetupSheet', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto })
  })

  it('configures a PIN only after matching confirmation', async () => {
    const wrapper = mount(AppLockSetupSheet)
    await wrapper.get('[aria-label="选择数字密码"]').trigger('click')
    await wrapper.get('input[aria-label="输入6位密码"]').setValue('123456')
    await wrapper.get('[aria-label="下一步"]').trigger('click')
    await wrapper.get('input[aria-label="再次输入6位密码"]').setValue('654321')
    await wrapper.get('[aria-label="保存应用锁"]').trigger('click')
    expect(wrapper.text()).toContain('两次输入不一致')

    await wrapper.get('input[aria-label="再次输入6位密码"]').setValue('123456')
    await wrapper.get('[aria-label="保存应用锁"]').trigger('click')
    await vi.waitFor(() => expect(getAppLockType()).toBe('pin'))
  })
})
