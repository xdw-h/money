import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookkeepingDatabase } from '../../src/shared/db/database'
import { mapIconQueries, mapIconQuery, parseIconKey, searchIconify, storeIconAsset } from '../../src/features/icons/iconService'

describe('icon service', () => {
  let database: BookkeepingDatabase
  beforeEach(() => { database = new BookkeepingDatabase(`icons-${crypto.randomUUID()}`) })
  afterEach(async () => { await database.delete() })

  it('parses Iconify keys and maps Chinese bookkeeping queries', () => {
    expect(parseIconKey('iconify:mdi:coffee')).toEqual({ prefix: 'mdi', name: 'coffee' })
    expect(parseIconKey('📒')).toBeNull()
    expect(mapIconQuery('咖啡')).toBe('coffee')
    expect(mapIconQueries('吃饭')).toEqual(['food', 'restaurant', 'rice', 'bowl'])
    expect(mapIconQueries('地铁')).toEqual(['metro', 'train', 'station'])
  })

  it('keeps only base Fluent Emoji Flat results and removes duplicates', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ icons: [
      'fluent-emoji-flat:hamburger', 'fluent-emoji-flat:hamburger-light',
      'fluent-emoji-flat:fork-and-knife-with-plate', 'mdi:food',
    ] }) })
    await expect(searchIconify('吃饭', fetcher)).resolves.toEqual([
      'iconify:fluent-emoji-flat:hamburger',
      'iconify:fluent-emoji-flat:fork-and-knife-with-plate',
    ])
  })

  it('stores only safe Iconify SVG bodies', async () => {
    await storeIconAsset(database, { key: 'iconify:mdi:coffee', prefix: 'mdi', name: 'coffee', body: '<path d="M1 1h2"/>', width: 24, height: 24, cachedAt: '2026-08-21T00:00:00.000Z' })
    expect((await database.iconAssets.get('iconify:mdi:coffee'))?.name).toBe('coffee')
    await expect(storeIconAsset(database, { key: 'iconify:mdi:bad', prefix: 'mdi', name: 'bad', body: '<script>alert(1)</script>', width: 24, height: 24, cachedAt: '' })).rejects.toThrow('图标数据不安全')
    await storeIconAsset(database, { key: 'iconify:fluent-emoji-flat:hamburger', prefix: 'fluent-emoji-flat', name: 'hamburger', body: '<path fill="#ff0" d="M1 1h2"/>', width: 32, height: 32, cachedAt: '2026-08-21T00:00:00.000Z' })
  })
})
