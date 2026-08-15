export type RecordType = 'expense' | 'income'

export interface RecordEntity {
  id: string
  type: RecordType
  amount: number
  categoryId: string
  subcategoryId?: string
  occurredAt: string
  note: string
  imageIds: string[]
  createdAt: string
  updatedAt: string
}

export type RecordDraft = Omit<RecordEntity, 'id' | 'createdAt' | 'updatedAt'>

export interface ImageEntity {
  id: string
  recordId: string
  name: string
  mimeType: string
  size: number
  blob: Blob
  thumbnailBlob: Blob
  createdAt: string
}

export interface CategoryEntity {
  id: string
  type: RecordType
  name: string
  icon: string
  order: number
  parentId?: string
}
