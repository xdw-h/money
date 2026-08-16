import type { CategoryEntity, ImageEntity, LedgerEntity, RecordEntity } from '../records/types'

export interface BackupManifest { version: 1; createdAt: string; records: number; images: number }
export interface BackupData {
  records: RecordEntity[]
  categories: CategoryEntity[]
  ledgers?: LedgerEntity[]
  images: Array<Omit<ImageEntity, 'blob' | 'thumbnailBlob'> & { file: string }>
}
