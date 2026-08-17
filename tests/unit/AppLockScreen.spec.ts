import { webcrypto } from 'node:crypto'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppLockScreen from '../../src/features/appLock/AppLockScreen.vue'
import PatternLock from '../../src/features/appLock/PatternLock.vue'
import { appUnlocked, configurePin, lockApp } from '../../src/features/appLock/appLockStore'

describe('AppLockScreen', () => {
  beforeEach(async () => {
    localStorage.clear()
    sessionStorage.clear()
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto })
    await configurePin('123456')
    lockApp()
  })

  it('unlocks with the correct PIN and rejects a wrong PIN', async () => {
    const wrapper = mount(AppLockScreen)
    for (const value of '654321') await wrapper.get(`[aria-label="数字${value}"]`).trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('密码错误'))
    expect(appUnlocked.value).toBe(false)

    for (const value of '123456') await wrapper.get(`[aria-label="数字${value}"]`).trigger('click')
    await vi.waitFor(() => expect(appUnlocked.value).toBe(true))
  })

  it('places zero in the middle and delete on the right', () => {
    const wrapper = mount(AppLockScreen)
    const keys = wrapper.findAll('.pin-keypad button')
    expect(keys.at(-2)?.text()).toBe('0')
    expect(keys.at(-1)?.text()).toBe('删除')
  })

  it('emits an ordered unique gesture with at least four points', async () => {
    const wrapper = mount(PatternLock)
    for (const point of [1, 2, 5, 8]) await wrapper.get(`[aria-label="手势点${point}"]`).trigger('click')
    await wrapper.get('[aria-label="确认手势"]').trigger('click')
    expect(wrapper.emitted('complete')?.[0]).toEqual([[1, 2, 5, 8]])
  })

  it('draws and completes a gesture by sliding across points', async () => {
    const wrapper = mount(PatternLock)
    await wrapper.get('[aria-label="手势点1"]').trigger('pointerdown', { clientX: 10, clientY: 10 })
    for (const point of [2, 5, 8]) await wrapper.get(`[aria-label="手势点${point}"]`).trigger('pointerenter')
    expect(wrapper.findAll('.pattern-grid line').length).toBeGreaterThanOrEqual(3)
    await wrapper.get('.pattern-grid').trigger('pointerup')
    expect(wrapper.emitted('complete')?.[0]).toEqual([[1, 2, 5, 8]])
  })
})
