import { describe, expect, it } from 'vitest'
import { categoryRanking, filterPeriod, summarize, trendSeries } from '../../src/features/statistics/aggregate'
import type { RecordEntity } from '../../src/features/records/types'

const records: RecordEntity[] = [
  { id: '1', type: 'income', amount: 300000, categoryId: 'salary', occurredAt: '2026-08-15T04:00:00.000Z', note: '', imageIds: [], createdAt: '', updatedAt: '' },
  { id: '2', type: 'expense', amount: 24000, categoryId: 'health', occurredAt: '2026-08-16T04:00:00.000Z', note: '', imageIds: [], createdAt: '', updatedAt: '' },
  { id: '3', type: 'expense', amount: 6000, categoryId: 'food', occurredAt: '2026-07-31T04:00:00.000Z', note: '', imageIds: [], createdAt: '', updatedAt: '' },
]

describe('statistics aggregation', () => {
  it('summarizes the selected month in the business timezone', () => {
    expect(summarize(records, { mode: 'month', anchor: '2026-08-15', timeZone: 'Asia/Shanghai' }))
      .toEqual({ income: 300000, expense: 24000, balance: 276000, count: 2 })
  })

  it('ranks categories and creates a complete daily series', () => {
    expect(categoryRanking(records, { type: 'expense', mode: 'month', anchor: '2026-08-15', timeZone: 'Asia/Shanghai' })[0])
      .toMatchObject({ categoryId: 'health', amount: 24000, count: 1, percent: 100 })
    const series = trendSeries(records, { type: 'expense', mode: 'month', anchor: '2026-08-15', timeZone: 'Asia/Shanghai' })
    expect(series.labels).toHaveLength(31)
    expect(series.values[15]).toBe(24000)
  })

  it('creates twelve points for a yearly series', () => {
    expect(trendSeries(records, { type: 'income', mode: 'year', anchor: '2026-08-15', timeZone: 'Asia/Shanghai' }).labels).toHaveLength(12)
  })

  it('filters bill details to the selected period and type', () => {
    expect(filterPeriod(records, { type: 'expense', mode: 'month', anchor: '2026-08-15', timeZone: 'Asia/Shanghai' }).map(({ id }) => id)).toEqual(['2'])
  })
})
