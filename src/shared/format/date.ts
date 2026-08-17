type DateInput = string | number | Date | null | undefined

function parseDate(input: DateInput): Date | null {
  if (input === null || input === undefined || input === '') return null
  const normalized = typeof input === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)
    ? input.replace(' ', 'T')
    : input
  const date = normalized instanceof Date ? new Date(normalized.getTime()) : new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function parts(input: DateInput, timeZone?: string) {
  const date = parseDate(input)
  if (!date) return null
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  })
  return Object.fromEntries(
    formatter.formatToParts(date).map(({ type, value }) => [type, value]),
  )
}

export function formatDate(input: DateInput, timeZone?: string): string {
  const value = parts(input, timeZone)
  return value ? `${value.year}-${value.month}-${value.day}` : '-'
}

export function formatDateTime(input: DateInput, timeZone?: string): string {
  const value = parts(input, timeZone)
  return value
    ? `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}:${value.second}`
    : '-'
}

function calendarDate(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay)))
}

function calendarKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function billingCycleRange(anchor: string, cycleAnchorDate: string | number = 1) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(anchor)
  const anchorDay = typeof cycleAnchorDate === 'string' ? Number(/^(?:\d{4})-(?:\d{2})-(\d{2})$/.exec(cycleAnchorDate)?.[1]) : cycleAnchorDate
  const normalizedDay = Math.min(31, Math.max(1, Math.trunc(anchorDay) || 1))
  if (!match) return { start: '-', endExclusive: '-', endInclusive: '-' }
  const [, yearText, monthText, dayText] = match
  const year = Number(yearText); const month = Number(monthText); const day = Number(dayText)
  const currentStart = calendarDate(year, month, normalizedDay)
  const startsThisMonth = day >= currentStart.getUTCDate()
  const startMonth = startsThisMonth ? month : month - 1
  const start = calendarDate(year, startMonth, normalizedDay)
  const endExclusive = calendarDate(start.getUTCFullYear(), start.getUTCMonth() + 2, normalizedDay)
  const endInclusive = new Date(endExclusive.getTime() - 86400000)
  return { start: calendarKey(start), endExclusive: calendarKey(endExclusive), endInclusive: calendarKey(endInclusive) }
}

