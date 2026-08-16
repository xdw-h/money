import type { BookkeepingDatabase } from '../../shared/db/database'
import { createId } from '../../shared/id/createId'
import type { RecordDraft, RecordEntity } from './types'

export interface RecordRange {
  from: string
  to: string
}

function assertAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TypeError('金额必须是大于 0 的整数分')
  }
}

export function createRecordRepository(database: BookkeepingDatabase) {
  return {
    async createRecord(draft: RecordDraft): Promise<RecordEntity> {
      assertAmount(draft.amount)
      const now = new Date().toISOString()
      const record: RecordEntity = {
        ...draft,
        ledgerId: draft.ledgerId ?? 'default-ledger',
        id: createId(),
        imageIds: [...draft.imageIds],
        createdAt: now,
        updatedAt: now,
      }
      await database.records.add(record)
      return record
    },

    async updateRecord(id: string, changes: Partial<RecordDraft>): Promise<RecordEntity> {
      if (changes.amount !== undefined) assertAmount(changes.amount)
      const current = await database.records.get(id)
      if (!current) throw new Error('账目不存在')
      const updated: RecordEntity = {
        ...current,
        ...changes,
        id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      }
      await database.records.put(updated)
      return updated
    },

    async listRecords(range: RecordRange): Promise<RecordEntity[]> {
      return database.records
        .where('occurredAt')
        .between(range.from, range.to, true, false)
        .reverse()
        .sortBy('occurredAt')
    },

    async deleteRecord(id: string): Promise<void> {
      await database.transaction('rw', database.records, database.images, async () => {
        await database.images.where('recordId').equals(id).delete()
        await database.records.delete(id)
      })
    },
  }
}
