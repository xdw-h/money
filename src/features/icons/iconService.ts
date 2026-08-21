import type { BookkeepingDatabase } from '../../shared/db/database'
import { db } from '../../shared/db/database'
import { approvedIconPrefixes, iconQueriesFor, iconQueryAliases, searchableIconPrefix } from './iconCatalog'
import type { IconAsset, ParsedIconKey } from './types'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<{ ok: boolean; json(): Promise<unknown> }>

export function parseIconKey(value: string): ParsedIconKey | null {
  const match = /^iconify:([a-z0-9-]+):([a-z0-9-]+)$/.exec(value)
  return match ? { prefix: match[1], name: match[2] } : null
}

export function mapIconQuery(query: string) {
  const normalized = query.trim().toLowerCase()
  return iconQueryAliases[normalized] ?? normalized
}

export function mapIconQueries(query: string) {
  const normalized = query.trim().toLowerCase()
  return normalized ? iconQueriesFor(normalized) : []
}

export function isSafeIconBody(body: string) {
  if (!body || /<(script|foreignObject|iframe|object|embed|style)\b/i.test(body) || /\son[a-z]+\s*=/i.test(body) || /javascript:/i.test(body)) return false
  const document = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`, 'image/svg+xml')
  return !document.querySelector('parsererror') && [...document.querySelectorAll('*')].every((node) => ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g'].includes(node.tagName))
}

export async function storeIconAsset(database: BookkeepingDatabase, asset: IconAsset) {
  if (!parseIconKey(asset.key) || !approvedIconPrefixes.includes(asset.prefix as typeof approvedIconPrefixes[number]) || !isSafeIconBody(asset.body)) throw new Error('图标数据不安全')
  await database.iconAssets.put(asset)
}

export async function searchIconify(query: string, fetcher: FetchLike = fetch) {
  const keywords = mapIconQueries(query).filter((keyword) => !/[^\x00-\x7F]/.test(keyword))
  const found = new Set<string>()
  for (const keyword of keywords) {
    const response = await fetcher(`https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&prefixes=${searchableIconPrefix}&limit=64`)
    if (!response.ok) throw new Error('图标搜索失败')
    const data = await response.json() as { icons?: string[] }
    for (const item of data.icons ?? []) {
      if (!item.startsWith(`${searchableIconPrefix}:`)) continue
      const name = item.slice(searchableIconPrefix.length + 1)
      if (/(?:-light|-medium-light|-medium|-medium-dark|-dark|-left|-right)$/.test(name)) continue
      found.add(`iconify:${item}`)
      if (found.size >= 48) break
    }
  }
  return [...found]
}

export async function fetchIconAsset(key: string, fetcher: FetchLike = fetch, database: BookkeepingDatabase = db) {
  const cached = await database.iconAssets.get(key)
  if (cached) return cached
  const parsed = parseIconKey(key)
  if (!parsed || !approvedIconPrefixes.includes(parsed.prefix as typeof approvedIconPrefixes[number])) throw new Error('不支持的图标')
  const response = await fetcher(`https://api.iconify.design/${parsed.prefix}.json?icons=${encodeURIComponent(parsed.name)}`)
  if (!response.ok) throw new Error('图标加载失败')
  const data = await response.json() as { width?: number; height?: number; icons?: Record<string, { body?: string; width?: number; height?: number }> }
  const icon = data.icons?.[parsed.name]
  const asset: IconAsset = { key, ...parsed, body: icon?.body ?? '', width: icon?.width ?? data.width ?? 24, height: icon?.height ?? data.height ?? 24, cachedAt: new Date().toISOString() }
  await storeIconAsset(database, asset)
  return asset
}
