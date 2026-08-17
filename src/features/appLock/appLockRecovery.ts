import type { BookkeepingDatabase } from '../../shared/db/database'
import { importBackup } from '../backup/backupService'
import { disableAppLock } from './appLockStore'

export const recoverFromBackup = async (file: Blob, database: BookkeepingDatabase) => {
  const result = await importBackup(file, database)
  disableAppLock()
  return result
}

export const clearAppDataAndLock = async (database: BookkeepingDatabase, phrase: string) => {
  if (phrase !== '确认清空') throw new Error('请输入“确认清空”')
  await database.transaction('rw', database.records, database.images, database.categories, database.ledgers, async () => {
    await Promise.all([database.records.clear(), database.images.clear(), database.categories.clear(), database.ledgers.clear()])
  })
  disableAppLock()
}
