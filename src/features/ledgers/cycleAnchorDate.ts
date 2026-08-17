function normalizeDay(value: unknown) {
  const day = typeof value === 'number' ? Math.trunc(value) : Number(value)
  return Number.isFinite(day) ? Math.min(31, Math.max(1, day)) : 1
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function localTodayKey(now = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function normalizeCycleAnchorDate(value: unknown, legacyStartDay: unknown = 1, today = localTodayKey()) {
  if (isCalendarDate(value)) return value
  const [year, month] = today.split('-').map(Number)
  const day = Math.min(normalizeDay(legacyStartDay), new Date(year, month, 0).getDate())
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
