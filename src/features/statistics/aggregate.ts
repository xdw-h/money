import type { RecordEntity, RecordType } from '../records/types'

export type PeriodMode = 'month' | 'year'
interface PeriodOptions { mode: PeriodMode; anchor: string; timeZone?: string }
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

function inPeriod(record: RecordEntity, options: PeriodOptions) {
  const date = dateParts(record.occurredAt, options.timeZone)
  const anchor = anchorParts(options.anchor)
  return date.year === anchor.year && (options.mode === 'year' || date.month === anchor.month)
}

export function summarize(records: RecordEntity[], options: PeriodOptions) {
  const selected = records.filter((record) => inPeriod(record, options))
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
  const length = options.mode === 'year' ? 12 : new Date(anchor.year, anchor.month, 0).getDate()
  const labels = Array.from({ length }, (_, index) => options.mode === 'year' ? `${index + 1}月` : `${index + 1}`)
  const values = Array.from({ length }, () => 0)
  for (const record of filterPeriod(records, options)) {
    const date = dateParts(record.occurredAt, options.timeZone)
    values[options.mode === 'year' ? date.month - 1 : date.day - 1] += record.amount
  }
  return { labels, values }
}
