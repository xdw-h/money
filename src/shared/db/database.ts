import Dexie, { type EntityTable } from 'dexie'
import type { CategoryEntity, ImageEntity, RecordEntity } from '../../features/records/types'

export class BookkeepingDatabase extends Dexie {
  records!: EntityTable<RecordEntity, 'id'>
  images!: EntityTable<ImageEntity, 'id'>
  categories!: EntityTable<CategoryEntity, 'id'>

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
  }
}

export const db = new BookkeepingDatabase()
