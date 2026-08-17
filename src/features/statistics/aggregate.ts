import type { RecordEntity, RecordType } from '../records/types'
import { billingCycleRange } from '../../shared/format/date'

export type PeriodMode = 'month' | 'year'
interface PeriodOptions { mode: PeriodMode; anchor: string; timeZone?: string; cycleAnchorDate?: string; cycleStartDates?: Record<string, string>; cycleEndDates?: Record<string, string> }
interface TrendOptions extends PeriodOptions { type: RecordType }

function dateParts(iso: string, timeZone?: string) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(iso)).map(({ type, value }) => [type, value]))
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) }
}

function anchorParts(anchor: string) {
  const [year, month] = anchor.slice(0, 10).split('-').map(Number)
  return { year, month }
}

function dateKey({ year, month, day }: { year: number; month: number; day: number }) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function inPeriod(record: RecordEntity, options: PeriodOptions) {
  const date = dateParts(record.occurredAt, options.timeZone)
  const anchor = anchorParts(options.anchor)
  if (options.mode === 'year') return date.year === anchor.year
  const range = billingCycleRange(options.anchor, options.cycleAnchorDate, options.cycleStartDates, options.cycleEndDates)
  const key = dateKey(date)
  return key >= range.start && key < range.endExclusive
}

export function summarize(records: RecordEntity[], options: PeriodOptions) {
  const selected = records.filter((record) => inPeriod(record, options))
  const income = selected.filter(({ type }) => type === 'income').reduce((sum, { amount }) => sum + amount, 0)
  const expense = selected.filter(({ type }) => type === 'expense').reduce((sum, { amount }) => sum + amount, 0)
  return { income, expense, balance: income - expense, count: selected.length }
}

export function summarizeThroughYear(records: RecordEntity[], options: PeriodOptions) {
  const selectedYear = anchorParts(options.anchor).year
  const selected = records.filter((record) => dateParts(record.occurredAt, options.timeZone).year <= selectedYear)
  const income = selected.filter(({ type }) => type === 'income').reduce((sum, { amount }) => sum + amount, 0)
  const expense = selected.filter(({ type }) => type === 'expense').reduce((sum, { amount }) => sum + amount, 0)
  return { income, expense, balance: income - expense, count: selected.length }
}

export function filterPeriod(records: RecordEntity[], options: TrendOptions) {
  return records.filter((record) => record.type === options.type && inPeriod(record, options))
}

export function categoryRanking(records: RecordEntity[], options: TrendOptions) {
  const grouped = new Map<string, { amount: number; count: number }>()
  for (const record of filterPeriod(records, options)) {
    const value = grouped.get(record.categoryId) ?? { amount: 0, count: 0 }
    grouped.set(record.categoryId, { amount: value.amount + record.amount, count: value.count + 1 })
  }
  const total = [...grouped.values()].reduce((sum, item) => sum + item.amount, 0)
  return [...grouped.entries()].map(([categoryId, value]) => ({
    categoryId, ...value, percent: total ? Math.round(value.amount / total * 100) : 0,
  })).sort((a, b) => b.amount - a.amount)
}

export function trendSeries(records: RecordEntity[], options: TrendOptions) {
  const anchor = anchorParts(options.anchor)
  const range = billingCycleRange(options.anchor, options.cycleAnchorDate, options.cycleStartDates, options.cycleEndDates)
  const startTime = Date.parse(`${range.start}T00:00:00Z`); const endTime = Date.parse(`${range.endExclusive}T00:00:00Z`)
  const length = options.mode === 'year' ? 12 : Math.round((endTime - startTime) / 86400000)
  const dateKeys = options.mode === 'year' ? [] : Array.from({ length }, (_, index) => {
    const date = new Date(startTime + index * 86400000)
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  })
  const labels = options.mode === 'year'
    ? Array.from({ length }, (_, index) => `${index + 1}月`)
    : dateKeys.map((key) => options.cycleAnchorDate && !options.cycleAnchorDate.endsWith('-01') ? `${Number(key.slice(5, 7))}-${Number(key.slice(8, 10))}` : `${Number(key.slice(8, 10))}`)
  const values = Array.from({ length }, () => 0)
  const dateIndexes = new Map(dateKeys.map((key, index) => [key, index]))
  for (const record of filterPeriod(records, options)) {
    const date = dateParts(record.occurredAt, options.timeZone)
    const index = options.mode === 'year' ? date.month - 1 : dateIndexes.get(dateKey(date))
    if (index !== undefined) values[index] += record.amount
  }
  return { labels, values }
}
