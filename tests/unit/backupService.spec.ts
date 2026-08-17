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
})
