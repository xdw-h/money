import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import { BookkeepingDatabase } from '../../src/shared/db/database'
import { savePlan, saveDeposit, deleteDeposit, deletePlan, savingsProgress, parseSavingsAmount } from '../../src/features/savings/savingsService'

const database = new BookkeepingDatabase(`savings-${crypto.randomUUID()}`)
afterEach(async () => { await database.savingsDeposits.clear(); await database.savingsPlans.clear() })
describe('savings plans', () => {
  it('upgrades a version 6 database while preserving existing records', async () => {
    const name = `upgrade-${crypto.randomUUID()}`
    const old = new Dexie(name)
    old.version(6).stores({ records:'id, ledgerId, type, categoryId, subcategoryId, occurredAt, createdAt', images:'id, recordId, createdAt', categories:'id, type, parentId, order', ledgers:'id, createdAt', iconAssets:'key, prefix, cachedAt' })
    await old.table('records').add({ id:'existing', amount:100 })
    old.close()
    const upgraded = new BookkeepingDatabase(name)
    try {
      expect((await upgraded.records.get('existing'))?.amount).toBe(100)
      expect(await upgraded.savingsPlans.count()).toBe(0)
      expect(await upgraded.savingsDeposits.count()).toBe(0)
    } finally { await upgraded.delete() }
  })
  it('deletes only the selected plan and its records', async () => {
    const a = await savePlan(database, {name:'A', targetAmount:100, defaultAmount:10})
    const b = await savePlan(database, {name:'B', targetAmount:100, defaultAmount:10})
    await saveDeposit(database, {planId:a.id, amount:10, note:''})
    await saveDeposit(database, {planId:b.id, amount:20, note:''})
    await deletePlan(database, a.id)
    expect(await database.savingsPlans.count()).toBe(1)
    expect((await database.savingsDeposits.toArray())[0]?.planId).toBe(b.id)
  })
  it('accepts deposits below and above the default and recalculates after correction', async () => {
    const plan = await savePlan(database, { name: '环球旅行', targetAmount: 10000, defaultAmount: 3000 })
    const a = await saveDeposit(database, { planId: plan.id, amount: 1000, note: '' })
    await saveDeposit(database, { planId: plan.id, amount: 11000, note: '奖金' })
    expect(savingsProgress(plan, await database.savingsDeposits.toArray()).percent).toBe(120)
    await saveDeposit(database, { ...a, amount: 2000 })
    expect(savingsProgress(plan, await database.savingsDeposits.toArray()).total).toBe(13000)
    await deleteDeposit(database, a.id)
    expect(savingsProgress(plan, await database.savingsDeposits.toArray()).total).toBe(11000)
    expect(await database.records.count()).toBe(0)
  })
  it('includes the deadline day and handles expired and completed plans', () => {
    const plan = { id: 'p', name: '旅行', targetAmount: 10000, defaultAmount: 100, deadline: '2026-10-30', createdAt: '' }
    expect(savingsProgress(plan, [], '2026-10-30')).toMatchObject({ daysLeft: 1, dailyAmount: 10000, expired: false })
    expect(savingsProgress(plan, [], '2026-10-31')).toMatchObject({ daysLeft: 0, dailyAmount: 0, expired: true })
    expect(savingsProgress(plan, [{ id: 'd', planId: 'p', amount: 11000, occurredAt: '', note: '' }], '2026-10-31')).toMatchObject({ remaining: 0, completed: true, expired: false, barPercent: 100 })
  })
  it('rejects invalid amounts and missing plans', async () => {
    for (const value of ['', '0', '-1', 'NaN', '1.001', '1e3']) expect(() => parseSavingsAmount(value)).toThrow()
    expect(parseSavingsAmount('0.29')).toBe(29)
    await expect(savePlan(database, { name: ' ', targetAmount: 100, defaultAmount: 100 })).rejects.toThrow()
    await expect(savePlan(database, { name: '旅行', targetAmount: 100, defaultAmount: 100, deadline: '2026-02-30' })).rejects.toThrow()
    await expect(saveDeposit(database, { planId: 'missing', amount: 100, note: '' })).rejects.toThrow()
  })
})
