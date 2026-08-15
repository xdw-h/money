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

