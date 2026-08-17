import { computed, ref } from 'vue'
import { db } from '../../shared/db/database'
import { createId } from '../../shared/id/createId'
import type { LedgerEntity } from '../records/types'
import { localTodayKey, normalizeCycleAnchorDate, normalizeCycleEndDates, normalizeCycleStartDates } from './cycleAnchorDate'

const DEFAULT_ID = 'default-ledger'
export const ledgerItems = ref<LedgerEntity[]>([])
export const activeLedgerId = ref(localStorage.getItem('money-active-ledger') || DEFAULT_ID)
export const activeLedger = computed(() => ledgerItems.value.find((item) => item.id === activeLedgerId.value) ?? ledgerItems.value[0])
let loaded = false

export async function loadLedgers() {
  if (!loaded) {
    if (typeof indexedDB === 'undefined') {
      ledgerItems.value = [{ id: DEFAULT_ID, name: '日常账本', icon: '📒', cycleAnchorDate: normalizeCycleAnchorDate(undefined), createdAt: new Date().toISOString() }]
      loaded = true
      return ledgerItems.value
    }
    let saved = await db.ledgers.orderBy('createdAt').toArray()
    if (!saved.length) {
      const ledger = { id: DEFAULT_ID, name: '日常账本', icon: '📒', cycleAnchorDate: normalizeCycleAnchorDate(undefined), createdAt: new Date().toISOString() }
      await db.ledgers.add(ledger); saved = [ledger]
      await db.records.filter((record) => !record.ledgerId).modify({ ledgerId: DEFAULT_ID })
    }
    ledgerItems.value = saved.map((ledger) => {
      const { cycleStartDay, ...rest } = ledger
      return { ...rest, cycleAnchorDate: normalizeCycleAnchorDate(ledger.cycleAnchorDate, cycleStartDay), cycleStartDates: normalizeCycleStartDates(ledger.cycleStartDates), cycleEndDates: normalizeCycleEndDates(ledger.cycleEndDates) }
    }); loaded = true
  }
  if (!ledgerItems.value.some((item) => item.id === activeLedgerId.value)) setActiveLedger(ledgerItems.value[0].id)
  return ledgerItems.value
}

export function setActiveLedger(id: string) {
  if (!ledgerItems.value.some((item) => item.id === id)) return
  activeLedgerId.value = id; localStorage.setItem('money-active-ledger', id)
}

export async function addLedger(name: string, icon = '📒', cycleAnchorDate = `${localTodayKey().slice(0, 7)}-01`) {
  const normalized = name.trim().slice(0, 12)
  if (!normalized) throw new Error('请输入账本名称')
  if (ledgerItems.value.some((item) => item.name === normalized)) throw new Error('账本名称已存在')
  const ledger = { id: `ledger-${createId()}`, name: normalized, icon, cycleAnchorDate: normalizeCycleAnchorDate(cycleAnchorDate), createdAt: new Date().toISOString() }
  await db.ledgers.add(ledger); ledgerItems.value = [...ledgerItems.value, ledger]; setActiveLedger(ledger.id)
  return ledger
}

export async function updateLedger(id: string, name: string, icon: string, cycleAnchorDate?: string) {
  const normalized = name.trim().slice(0, 12)
  if (!normalized) throw new Error('请输入账本名称')
  const ledger = ledgerItems.value.find((item) => item.id === id)
  if (!ledger) throw new Error('账本不存在')
  const { cycleStartDay: _legacyStartDay, ...current } = ledger
  const updated = { ...current, name: normalized, icon, cycleAnchorDate: normalizeCycleAnchorDate(cycleAnchorDate ?? ledger.cycleAnchorDate, _legacyStartDay) }
  await db.ledgers.put(updated); ledgerItems.value = ledgerItems.value.map((item) => item.id === id ? updated : item)
}

export async function setLedgerCycleStartDate(id: string, month: string, date?: string) {
  const ledger = ledgerItems.value.find((item) => item.id === id)
  if (!ledger) throw new Error('账本不存在')
  if (date && ledger.cycleEndDates?.[month] && date > ledger.cycleEndDates[month]) throw new Error('起始日不能晚于终止日')
  const updated = { ...ledger, cycleStartDates: normalizeCycleStartDates({ ...ledger.cycleStartDates, [month]: date }) }
  await db.ledgers.put(updated); ledgerItems.value = ledgerItems.value.map((item) => item.id === id ? updated : item)
}

export async function clearLedgerCycleStartDate(id: string, month: string) {
  const ledger = ledgerItems.value.find((item) => item.id === id)
  if (!ledger) throw new Error('账本不存在')
  const cycleStartDates = { ...ledger.cycleStartDates }; delete cycleStartDates[month]
  const updated = { ...ledger, cycleStartDates }
  await db.ledgers.put(updated); ledgerItems.value = ledgerItems.value.map((item) => item.id === id ? updated : item)
}

export async function setLedgerCycleEndDate(id: string, month: string, date?: string) {
  const ledger = ledgerItems.value.find((item) => item.id === id)
  if (!ledger) throw new Error('账本不存在')
  const start = ledger.cycleStartDates?.[month] || `${month}-01`
  if (date && date < start) throw new Error('终止日不能早于起始日')
  const updated = { ...ledger, cycleEndDates: normalizeCycleEndDates({ ...ledger.cycleEndDates, [month]: date }) }
  await db.ledgers.put(updated); ledgerItems.value = ledgerItems.value.map((item) => item.id === id ? updated : item)
}

export async function clearLedgerCycleEndDate(id: string, month: string) {
  const ledger = ledgerItems.value.find((item) => item.id === id)
  if (!ledger) throw new Error('账本不存在')
  const cycleEndDates = { ...ledger.cycleEndDates }; delete cycleEndDates[month]
  const updated = { ...ledger, cycleEndDates }
  await db.ledgers.put(updated); ledgerItems.value = ledgerItems.value.map((item) => item.id === id ? updated : item)
}

export async function deleteLedger(id: string) {
  if (ledgerItems.value.length <= 1) throw new Error('至少保留一个账本')
  const recordIds = await db.records.where('ledgerId').equals(id).primaryKeys()
  await db.transaction('rw', db.ledgers, db.records, db.images, async () => {
    if (recordIds.length) await db.images.where('recordId').anyOf(recordIds).delete()
    await db.records.where('ledgerId').equals(id).delete()
    await db.ledgers.delete(id)
  })
  ledgerItems.value = ledgerItems.value.filter((item) => item.id !== id)
  if (activeLedgerId.value === id) setActiveLedger(ledgerItems.value[0].id)
}
