import { readFile, writeFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/features/icons/bundledIconCatalog.ts', import.meta.url), 'utf8')
const names = [...source.matchAll(/'([a-z0-9-]+)'/g)].map((match) => match[1]).filter((name) => !['餐饮', '购物', '交通', '住房', '医疗', '学习', '娱乐', '旅行', '收入', '宠物'].includes(name))
const chunks = Array.from({ length: Math.ceil(names.length / 40) }, (_, index) => names.slice(index * 40, index * 40 + 40))
const collections = await Promise.all(chunks.map(async (chunk) => {
  const response = await fetch(`https://api.iconify.design/fluent-emoji-flat.json?icons=${encodeURIComponent(chunk.join(','))}`)
  if (!response.ok) throw new Error(`Iconify collection download failed: ${response.status}`)
  return response.json()
}))
const collection = { width: 32, height: 32, icons: Object.assign({}, ...collections.map((item) => item.icons ?? {})) }
const missing = names.filter((name) => !collection.icons[name])
if (missing.length) throw new Error(`Missing Fluent Emoji Flat icons: ${missing.join(', ')}`)
const assets = Object.fromEntries(names.map((name) => {
  const icon = collection.icons[name]
  return [`iconify:fluent-emoji-flat:${name}`, {
    key: `iconify:fluent-emoji-flat:${name}`, prefix: 'fluent-emoji-flat', name,
    body: icon.body, width: icon.width ?? collection.width ?? 32, height: icon.height ?? collection.height ?? 32,
    cachedAt: 'bundled',
  }]
}))
const output = `import type { IconAsset } from './types'\n\nexport const bundledIconAssets: Record<string, IconAsset> = ${JSON.stringify(assets)}\n`
await writeFile(new URL('../src/features/icons/bundledIconAssets.ts', import.meta.url), output)
console.log(`Generated ${names.length} bundled Fluent Emoji Flat icons`)
