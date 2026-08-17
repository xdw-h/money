export interface StorageProtectionStatus {
  supported: boolean
  persisted: boolean
  usage: number | null
  quota: number | null
  error?: string
}

interface StorageManagerLike {
  estimate(): Promise<{ usage?: number; quota?: number }>
  persisted(): Promise<boolean>
  persist?: () => Promise<boolean>
}

function browserStorage(): StorageManagerLike | undefined {
  if (typeof navigator === 'undefined') return undefined
  const storage = navigator.storage as StorageManagerLike | undefined
  if (!storage?.estimate || !storage?.persisted) return undefined
  return storage
}

export function formatBytes(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value < 0) return '-'
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let amount = value / 1024
  let unit = units[0]
  for (let index = 1; index < units.length && amount >= 1024; index += 1) {
    amount /= 1024
    unit = units[index]
  }
  return `${Number(amount.toFixed(1))} ${unit}`
}

export async function getStorageProtectionStatus(storage = browserStorage()): Promise<StorageProtectionStatus> {
  if (!storage) return { supported: false, persisted: false, usage: null, quota: null }
  try {
    const [estimate, persisted] = await Promise.all([storage.estimate(), storage.persisted()])
    return {
      supported: true,
      persisted,
      usage: estimate.usage ?? null,
      quota: estimate.quota ?? null,
    }
  } catch {
    return { supported: true, persisted: false, usage: null, quota: null, error: '无法读取浏览器存储状态' }
  }
}

export async function requestStorageProtection(storage = browserStorage()): Promise<StorageProtectionStatus> {
  if (!storage) return { supported: false, persisted: false, usage: null, quota: null }
  if (!storage.persist) return { ...(await getStorageProtectionStatus(storage)), supported: false }
  try {
    const persisted = await storage.persist()
    const estimate = await storage.estimate()
    return {
      supported: true,
      persisted,
      usage: estimate.usage ?? null,
      quota: estimate.quota ?? null,
    }
  } catch {
    return { supported: true, persisted: false, usage: null, quota: null, error: '存储保护申请失败，请稍后重试' }
  }
}
