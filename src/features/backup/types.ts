import type { CategoryEntity, ImageEntity, RecordEntity } from '../records/types'

export interface BackupManifest { version: 1; createdAt: string; records: number; images: number }
export interface BackupData {
  records: RecordEntity[]
  categories: CategoryEntity[]
  images: Array<Omit<ImageEntity, 'blob' | 'thumbnailBlob'> & { file: string }>
}

