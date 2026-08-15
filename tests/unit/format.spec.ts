import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime } from '../../src/shared/format/date'
import { formatMoney } from '../../src/shared/format/money'

describe('money formatter', () => {
  it('formats integer cents without floating-point drift', () => {
    expect(formatMoney(24000)).toBe('¥240.00')
    expect(formatMoney(300000)).toBe('¥3,000.00')
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
})
