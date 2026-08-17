import { describe, expect, it } from 'vitest'
import { billingCycleRange, formatDate, formatDateTime } from '../../src/shared/format/date'
import { formatMoney } from '../../src/shared/format/money'

describe('money formatter', () => {
  it('formats integer cents without floating-point drift', () => {
    expect(formatMoney(24000)).toBe('¥240.00')
    expect(formatMoney(300000)).toBe('¥3,000.00')
  })
  it('supports a different start date for each month', () => {
    const overrides = { '2026-08': '2026-08-10', '2026-09': '2026-09-20' }
    expect(billingCycleRange('2026-09-05', '2025-01-01', overrides)).toEqual({ start: '2026-08-10', endExclusive: '2026-09-20', endInclusive: '2026-09-19' })
    expect(billingCycleRange('2026-09-21', '2025-01-01', overrides)).toEqual({ start: '2026-09-20', endExclusive: '2026-10-01', endInclusive: '2026-09-30' })
  })

  it('supports an inclusive custom end date for a cycle', () => {
    expect(billingCycleRange('2026-08-20', '2025-01-01', { '2026-08': '2026-08-10' }, { '2026-08': '2026-09-05' }))
      .toEqual({ start: '2026-08-10', endExclusive: '2026-09-06', endInclusive: '2026-09-05' })
  })
})

describe('date formatter', () => {
  it('converts ISO timestamps into the configured business timezone', () => {
    expect(formatDateTime('2026-08-05T08:23:10.000+00:00', 'Asia/Shanghai'))
      .toBe('2026-08-05 16:23:10')
  })

  it('formats database-style date strings and date-only output', () => {
    expect(formatDate('2026-08-05 08:23:10')).toBe('2026-08-05')
  })

  it('uses a safe fallback for empty or invalid values', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime('broken')).toBe('-')
  })

  it('calculates continuous ledger cycles around the configured start day', () => {
    expect(billingCycleRange('2026-08-17', '2024-03-15')).toEqual({ start: '2026-08-15', endExclusive: '2026-09-15', endInclusive: '2026-09-14' })
    expect(billingCycleRange('2026-08-10', '2024-03-15')).toEqual({ start: '2026-07-15', endExclusive: '2026-08-15', endInclusive: '2026-08-14' })
    expect(billingCycleRange('2027-01-03', '2026-08-05')).toEqual({ start: '2026-12-05', endExclusive: '2027-01-05', endInclusive: '2027-01-04' })
  })

  it('clamps cycle days 28 through 31 to short month endings', () => {
    expect(billingCycleRange('2026-02-20', '2025-01-31')).toEqual({ start: '2026-01-31', endExclusive: '2026-02-28', endInclusive: '2026-02-27' })
    expect(billingCycleRange('2026-02-28', '2025-01-31')).toEqual({ start: '2026-02-28', endExclusive: '2026-03-31', endInclusive: '2026-03-30' })
    expect(billingCycleRange('2028-02-29', '2025-01-31')).toEqual({ start: '2028-02-29', endExclusive: '2028-03-31', endInclusive: '2028-03-30' })
    for (const day of [1, 5, 15, 28, 29, 30, 31]) expect(billingCycleRange('2026-08-17', `2025-01-${String(day).padStart(2, '0')}`).start).toMatch(/^2026-0[78]-\d{2}$/)
  })
})
