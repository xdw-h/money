import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BookkeepingDatabase } from '../../src/shared/db/database'
import { createRecordRepository } from '../../src/features/records/recordRepository'

describe('record repository', () => {
  let db: BookkeepingDatabase

  beforeEach(() => {
    db = new BookkeepingDatabase(`test-${crypto.randomUUID()}`)
  })

  afterEach(async () => {
    await db.delete()
  })

  it('stores integer cents and lists records newest first in a date range', async () => {
    const repository = createRecordRepository(db)
    await repository.createRecord({
      type: 'expense', amount: 24000, categoryId: 'health',
      occurredAt: '2026-08-15T04:00:00.000Z', note: '牙科', imageIds: [],
    })
    await repository.createRecord({
      type: 'income', amount: 300000, categoryId: 'salary',
      occurredAt: '2026-08-16T04:00:00.000Z', note: '工资', imageIds: [],
    })

    const records = await repository.listRecords({
      from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z',
    })
    expect(records.map((record) => record.note)).toEqual(['工资', '牙科'])
    expect(records[1].amount).toBe(24000)
  })

  it('updates updatedAt while preserving createdAt', async () => {
    const repository = createRecordRepository(db)
    const saved = await repository.createRecord({
      type: 'expense', amount: 1000, categoryId: 'food',
      occurredAt: '2026-08-15T04:00:00.000Z', note: '', imageIds: [],
    })
    const updated = await repository.updateRecord(saved.id, { note: '午餐' })

    expect(updated.createdAt).toBe(saved.createdAt)
    expect(updated.updatedAt >= saved.updatedAt).toBe(true)
    expect(updated.note).toBe('午餐')
  })

  it('deletes the record and all linked images in one operation', async () => {
    const repository = createRecordRepository(db)
    const imageId = crypto.randomUUID()
    const saved = await repository.createRecord({
      type: 'expense', amount: 1000, categoryId: 'food',
      occurredAt: '2026-08-15T04:00:00.000Z', note: '', imageIds: [imageId],
    })
    await db.images.add({
      id: imageId, recordId: saved.id, name: 'receipt.jpg', mimeType: 'image/jpeg',
      size: 3, blob: new Blob(['img']), thumbnailBlob: new Blob(['tn']), createdAt: new Date().toISOString(),
    })

    await repository.deleteRecord(saved.id)

    expect(await db.records.get(saved.id)).toBeUndefined()
    expect(await db.images.get(imageId)).toBeUndefined()
  })
})
