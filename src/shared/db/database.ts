import Dexie, { type EntityTable } from 'dexie'
import type { CategoryEntity, ImageEntity, LedgerEntity, RecordEntity } from '../../features/records/types'
import type { IconAsset } from '../../features/icons/types'
import { normalizeCycleAnchorDate } from '../../features/ledgers/cycleAnchorDate'

export class BookkeepingDatabase extends Dexie {
  records!: EntityTable<RecordEntity, 'id'>
  images!: EntityTable<ImageEntity, 'id'>
  categories!: EntityTable<CategoryEntity, 'id'>
  ledgers!: EntityTable<LedgerEntity, 'id'>
  iconAssets!: EntityTable<IconAsset, 'key'>

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
      await transaction.table('ledgers').put({ id: 'default-ledger', name: '日常账本', icon: '📒', cycleStartDay: 1, createdAt: new Date().toISOString() })
    })
    this.version(4).stores({
      records: 'id, ledgerId, type, categoryId, subcategoryId, occurredAt, createdAt',
      images: 'id, recordId, createdAt',
      categories: 'id, type, parentId, order',
      ledgers: 'id, createdAt',
    }).upgrade(async (transaction) => {
      await transaction.table('ledgers').toCollection().modify((ledger) => { ledger.cycleStartDay = 1 })
    })
    this.version(5).stores({
      records: 'id, ledgerId, type, categoryId, subcategoryId, occurredAt, createdAt',
      images: 'id, recordId, createdAt',
      categories: 'id, type, parentId, order',
      ledgers: 'id, createdAt',
    }).upgrade(async (transaction) => {
      await transaction.table('ledgers').toCollection().modify((ledger) => {
        ledger.cycleAnchorDate = normalizeCycleAnchorDate(ledger.cycleAnchorDate, ledger.cycleStartDay)
        delete ledger.cycleStartDay
      })
    })
    this.version(6).stores({
      records: 'id, ledgerId, type, categoryId, subcategoryId, occurredAt, createdAt',
      images: 'id, recordId, createdAt',
      categories: 'id, type, parentId, order',
      ledgers: 'id, createdAt',
      iconAssets: 'key, prefix, cachedAt',
    })
  }
}

export const db = new BookkeepingDatabase()
