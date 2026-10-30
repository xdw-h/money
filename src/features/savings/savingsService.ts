import type { BookkeepingDatabase } from '../../shared/db/database'
import { formatDate } from '../../shared/format/date'
import { createId } from '../../shared/id/createId'
import type { SavingsDeposit, SavingsPlan } from './types'

function checkAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 999999999999) throw new Error('请输入大于 0 且不超过 9,999,999,999.99 的金额，最多两位小数')
}

export function parseSavingsAmount(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('请输入有效金额，最多两位小数')
  const [whole, decimal = ''] = value.trim().split('.')
  const amount = Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
  checkAmount(amount)
  return amount
}

export function validateSavingsPlan(plan: SavingsPlan) {
  if (!plan.id || typeof plan.name !== 'string' || !plan.name.trim() || plan.name.length > 40) throw new Error('计划名称需为 1–40 个字')
  checkAmount(plan.targetAmount); checkAmount(plan.defaultAmount)
  if (plan.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(plan.deadline) || formatDate(`${plan.deadline}T12:00:00`) !== plan.deadline)) throw new Error('请选择有效的目标日期')
}

export function validateSavingsDeposit(deposit: SavingsDeposit) {
  checkAmount(deposit.amount)
  if (!deposit.id || !deposit.planId || typeof deposit.note !== 'string' || deposit.note.length > 200 || !Number.isFinite(Date.parse(deposit.occurredAt))) throw new Error('存入记录格式错误')
}

export async function savePlan(database: BookkeepingDatabase, input: Omit<SavingsPlan, 'id' | 'createdAt'> & Partial<Pick<SavingsPlan, 'id' | 'createdAt'>>) {
  const plan: SavingsPlan = { ...input, name: input.name.trim(), id: input.id ?? createId(), createdAt: input.createdAt ?? new Date().toISOString() }
  validateSavingsPlan(plan)
  await database.savingsPlans.put(plan)
  return plan
}

export async function saveDeposit(database: BookkeepingDatabase, input: Omit<SavingsDeposit, 'id' | 'occurredAt'> & Partial<Pick<SavingsDeposit, 'id' | 'occurredAt'>>) {
  const deposit: SavingsDeposit = { ...input, id: input.id ?? createId(), occurredAt: input.occurredAt ?? new Date().toISOString() }
  validateSavingsDeposit(deposit)
  await database.transaction('rw', database.savingsPlans, database.savingsDeposits, async () => {
    if (!await database.savingsPlans.get(input.planId)) throw new Error('存钱计划不存在，请刷新后重试')
    const previous = await database.savingsDeposits.get(deposit.id)
    if (previous && previous.planId !== deposit.planId) throw new Error('不能更改记录所属计划')
    const entries = await database.savingsDeposits.where('planId').equals(deposit.planId).toArray()
    if (!Number.isSafeInteger(entries.filter(item => item.id !== deposit.id).reduce((sum, item) => sum + item.amount, deposit.amount))) throw new Error('累计金额超出可支持范围')
    await database.savingsDeposits.put(deposit)
  })
  return deposit
}

export async function deleteDeposit(database: BookkeepingDatabase, id: string) { await database.savingsDeposits.delete(id) }

export async function deletePlan(database: BookkeepingDatabase, id: string) {
  await database.transaction('rw', database.savingsPlans, database.savingsDeposits, async () => {
    await database.savingsDeposits.where('planId').equals(id).delete()
    await database.savingsPlans.delete(id)
  })
}

export function savingsProgress(plan: SavingsPlan, deposits: SavingsDeposit[], today = formatDate(new Date())) {
  const total = deposits.filter(item => item.planId === plan.id).reduce((sum, item) => sum + item.amount, 0)
  const remaining = Math.max(0, plan.targetAmount - total)
  const percent = Math.round(total / plan.targetAmount * 1000) / 10
  const daysLeft = plan.deadline ? Math.max(0, Math.round((Date.parse(`${plan.deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000) + 1) : null
  return { total, remaining, percent, barPercent: Math.min(100, percent), completed: remaining === 0, daysLeft,
    expired: remaining > 0 && daysLeft === 0, dailyAmount: daysLeft ? Math.ceil(remaining / daysLeft) : 0 }
}
