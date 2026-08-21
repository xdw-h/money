import type { CategoryEntity, ImageEntity, LedgerEntity, RecordEntity } from '../records/types'
import type { IconAsset } from '../icons/types'

export interface BackupManifest { version: 1 | 2; createdAt: string; records: number; images: number }
export interface BackupData {
  records: RecordEntity[]
  categories: CategoryEntity[]
  ledgers?: LedgerEntity[]
  images: Array<Omit<ImageEntity, 'blob' | 'thumbnailBlob'> & { file: string }>
  iconAssets?: IconAsset[]
}
