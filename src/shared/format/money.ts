const amountFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(cents: number): string {
  if (!Number.isFinite(cents)) return '-'
  return `¥${amountFormatter.format(cents / 100)}`
}

