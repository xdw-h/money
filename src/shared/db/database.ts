import Dexie, { type EntityTable } from 'dexie'
import type { CategoryEntity, ImageEntity, LedgerEntity, RecordEntity } from '../../features/records/types'

export class BookkeepingDatabase extends Dexie {
  records!: EntityTable<RecordEntity, 'id'>
  images!: EntityTable<ImageEntity, 'id'>
  categories!: EntityTable<CategoryEntity, 'id'>
  ledgers!: EntityTable<LedgerEntity, 'id'>

  constructor(name = 'money-bookkeeping') {
    super(name)
    this.version(1).stores({
      records: 'id, type, categoryId, occurredAt, createdAt',
      images: 'id, recordId, createdAt',
      categories: 'id, type, order',
    })
    this.version(2).stores({
      records: 'id, type, categoryId, subcategoryId, occurredAt, createdAt',
      images: 'id, recordId, createdAt',
      categories: 'id, type, parentId, order',
    })
    this.version(3).stores({
      records: 'id, ledgerId, type, categoryId, subcategoryId, occurredAt, createdAt',
      images: 'id, recordId, createdAt',
      categories: 'id, type, parentId, order',
      ledgers: 'id, createdAt',
    }).upgrade(async (transaction) => {
      await transaction.table('records').toCollection().modify((record) => { record.ledgerId = 'default-ledger' })
      await transaction.table('ledgers').put({ id: 'default-ledger', name: '日常账本', icon: '📒', createdAt: new Date().toISOString() })
    })
  }
}

export const db = new BookkeepingDatabase()
