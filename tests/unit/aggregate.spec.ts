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

  it('uses an inclusive ledger start and exclusive next-cycle start', () => {
    const cycleRecords: RecordEntity[] = [
      { id: 'before', type: 'expense', amount: 100, categoryId: 'food', occurredAt: '2026-08-14T15:59:59.000Z', note: '', imageIds: [], createdAt: '', updatedAt: '' },
      { id: 'start', type: 'expense', amount: 200, categoryId: 'food', occurredAt: '2026-08-14T16:00:00.000Z', note: '', imageIds: [], createdAt: '', updatedAt: '' },
      { id: 'last', type: 'expense', amount: 300, categoryId: 'food', occurredAt: '2026-09-14T15:59:59.000Z', note: '', imageIds: [], createdAt: '', updatedAt: '' },
      { id: 'next', type: 'expense', amount: 400, categoryId: 'food', occurredAt: '2026-09-14T16:00:00.000Z', note: '', imageIds: [], createdAt: '', updatedAt: '' },
    ]
    const options = { type: 'expense' as const, mode: 'month' as const, anchor: '2026-08-17', timeZone: 'Asia/Shanghai', cycleAnchorDate: '2024-03-15' }
    expect(filterPeriod(cycleRecords, options).map(({ id }) => id)).toEqual(['start', 'last'])
    expect(summarize(cycleRecords, options)).toEqual({ income: 0, expense: 500, balance: -500, count: 2 })
    const series = trendSeries(cycleRecords, options)
    expect(series.labels[0]).toBe('8-15')
    expect(series.labels.at(-1)).toBe('9-14')
  })
})
