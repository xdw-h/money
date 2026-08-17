export type RecordType = 'expense' | 'income'

export interface RecordEntity {
  id: string
  ledgerId?: string
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

export interface LedgerEntity {
  id: string
  name: string
  icon: string
  cycleAnchorDate: string
  cycleStartDay?: number
  createdAt: string
}

export type RecordDraft = Omit<RecordEntity, 'id' | 'ledgerId' | 'createdAt' | 'updatedAt'> & { ledgerId?: string }

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
