import { beforeEach, describe, expect, it } from 'vitest'
import { webcrypto } from 'node:crypto'
import {
  APP_LOCK_KEY,
  configurePattern,
  configurePin,
  getAppLockType,
  markBackgrounded,
  requiresUnlock,
  verifyCredential,
} from '../../src/features/appLock/appLockStore'

describe('app lock store', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto })
  })

  it('stores and verifies a six digit PIN without persisting plaintext', async () => {
    await configurePin('123456')
    expect(getAppLockType()).toBe('pin')
    expect(await verifyCredential('123456')).toBe(true)
    expect(await verifyCredential('654321')).toBe(false)
    expect(localStorage.getItem(APP_LOCK_KEY)).not.toContain('123456')
  })

  it('validates PIN and pattern rules', async () => {
    await expect(configurePin('12345')).rejects.toThrow('请输入6位数字密码')
    await expect(configurePattern([1, 2, 3])).rejects.toThrow('至少连接4个点')
    await expect(configurePattern([1, 2, 2, 3])).rejects.toThrow('不能重复连接')
    await configurePattern([1, 2, 5, 8])
    expect(await verifyCredential([1, 2, 5, 8])).toBe(true)
    expect(localStorage.getItem(APP_LOCK_KEY)).not.toContain('1,2,5,8')
  })

  it('requires unlock after five minutes in background', () => {
    markBackgrounded(1_000)
    expect(requiresUnlock(300_999)).toBe(false)
    expect(requiresUnlock(301_000)).toBe(true)
  })
})
