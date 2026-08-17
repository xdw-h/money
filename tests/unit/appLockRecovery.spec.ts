import 'fake-indexeddb/auto'
import { Blob as NodeBlob } from 'node:buffer'
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exportBackup } from '../../src/features/backup/backupService'
import { APP_LOCK_KEY, configurePin } from '../../src/features/appLock/appLockStore'
import { clearAppDataAndLock, recoverFromBackup } from '../../src/features/appLock/appLockRecovery'
import { BookkeepingDatabase } from '../../src/shared/db/database'

describe('app lock recovery', () => {
  let source: BookkeepingDatabase
  let target: BookkeepingDatabase
  beforeEach(async () => {
    localStorage.clear()
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto })
    source = new BookkeepingDatabase(`lock-source-${crypto.randomUUID()}`)
    target = new BookkeepingDatabase(`lock-target-${crypto.randomUUID()}`)
    await configurePin('123456')
  })
  afterEach(async () => { await source.delete(); await target.delete() })

  it('only resets the lock after a valid backup imports successfully', async () => {
    await expect(recoverFromBackup(new NodeBlob(['bad']) as Blob, target)).rejects.toThrow()
    expect(localStorage.getItem(APP_LOCK_KEY)).not.toBeNull()
    const backup = await exportBackup(source)
    await recoverFromBackup(backup, target)
    expect(localStorage.getItem(APP_LOCK_KEY)).toBeNull()
  })

  it('requires the exact reset phrase before clearing data and lock', async () => {
    const now = new Date().toISOString()
    await target.records.add({ id:'r1', type:'expense', amount:100, categoryId:'food', occurredAt:now, note:'', imageIds:[], createdAt:now, updatedAt:now })
    await expect(clearAppDataAndLock(target, '清空')).rejects.toThrow('请输入“确认清空”')
    expect(await target.records.count()).toBe(1)
    await clearAppDataAndLock(target, '确认清空')
    expect(await target.records.count()).toBe(0)
    expect(localStorage.getItem(APP_LOCK_KEY)).toBeNull()
  })
})
