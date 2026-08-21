import 'fake-indexeddb/auto'
import { Blob as NodeBlob } from 'node:buffer'
import JSZip from 'jszip'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exportBackup, importBackup } from '../../src/features/backup/backupService'
import { BookkeepingDatabase } from '../../src/shared/db/database'

describe('backup service', () => {
  let source: BookkeepingDatabase
  let target: BookkeepingDatabase
  beforeEach(() => {
    source = new BookkeepingDatabase(`source-${crypto.randomUUID()}`)
    target = new BookkeepingDatabase(`target-${crypto.randomUUID()}`)
  })
  afterEach(async () => { await source.delete(); await target.delete() })

  it('round-trips records and images through a versioned ZIP', async () => {
    const now = new Date().toISOString()
    await source.records.add({ id:'record-1', type:'expense', amount:24000, categoryId:'health', occurredAt:now, note:'牙科', imageIds:['image-1'], createdAt:now, updatedAt:now })
    await source.images.add({ id:'image-1', recordId:'record-1', name:'receipt.jpg', mimeType:'image/jpeg', size:3, blob:new NodeBlob(['img']) as Blob, thumbnailBlob:new NodeBlob(['tn']) as Blob, createdAt:now })

    const backup = await exportBackup(source)
    const result = await importBackup(backup, target)

    expect(result).toEqual({ imported: 1, skipped: 0, images: 1 })
    expect((await target.records.get('record-1'))?.note).toBe('牙科')
    expect(await target.images.count()).toBe(1)
    expect((await target.ledgers.get('default-ledger'))?.cycleAnchorDate).toMatch(/^\d{4}-\d{2}-01$/)
  })

  it('validates the complete archive before writing', async () => {
    const invalidBytes = await new JSZip().file('manifest.json', JSON.stringify({ version: 99 })).file('records.json', JSON.stringify({ records: [], categories: [], images: [] })).generateAsync({ type: 'uint8array' })
    const invalid = new NodeBlob([invalidBytes]) as Blob
    await expect(importBackup(invalid, target)).rejects.toThrow('不兼容')
    expect(await target.records.count()).toBe(0)
  })

  it('round-trips only referenced Iconify assets in a version 2 backup', async () => {
    const cachedAt = new Date().toISOString()
    await source.categories.add({ id:'coffee', type:'expense', name:'咖啡', icon:'iconify:mdi:coffee', order:1 })
    await source.iconAssets.bulkAdd([
      { key:'iconify:mdi:coffee', prefix:'mdi', name:'coffee', body:'<path d="M1 1h2"/>', width:24, height:24, cachedAt },
      { key:'iconify:mdi:unused', prefix:'mdi', name:'unused', body:'<path d="M2 2h2"/>', width:24, height:24, cachedAt },
    ])
    const backup = await exportBackup(source)
    const backupBytes = await new Promise<ArrayBuffer>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.readAsArrayBuffer(backup) })
    const zip = await JSZip.loadAsync(backupBytes)
    const manifest = JSON.parse(await zip.file('manifest.json')!.async('string'))
    const icons = JSON.parse(await zip.file('icons.json')!.async('string'))
    expect(manifest.version).toBe(2)
    expect(icons).toHaveLength(1)
    await importBackup(backup, target)
    expect((await target.iconAssets.get('iconify:mdi:coffee'))?.name).toBe('coffee')
  })

  it('continues to import version 1 backups', async () => {
    const bytes = await new JSZip()
      .file('manifest.json', JSON.stringify({ version:1, createdAt:new Date().toISOString(), records:0, images:0 }))
      .file('records.json', JSON.stringify({ records:[], categories:[], ledgers:[], images:[] }))
      .generateAsync({ type:'uint8array' })
    await expect(importBackup(new NodeBlob([bytes]) as Blob, target)).resolves.toEqual({ imported:0, skipped:0, images:0 })
  })

  it('does not duplicate bundled icon SVG bodies in the backup', async () => {
    const key = 'iconify:fluent-emoji-flat:hamburger'
    await source.categories.add({ id:'food', type:'expense', name:'餐饮', icon:key, order:1 })
    await source.iconAssets.add({ key, prefix:'fluent-emoji-flat', name:'hamburger', body:'<path fill="#f00" d="M1 1h2"/>', width:32, height:32, cachedAt:'bundled' })
    const backup = await exportBackup(source)
    const bytes = await new Promise<ArrayBuffer>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.readAsArrayBuffer(backup) })
    const zip = await JSZip.loadAsync(bytes)
    expect(JSON.parse(await zip.file('icons.json')!.async('string'))).toEqual([])
  })
})
