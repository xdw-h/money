import { describe, expect, it, vi } from 'vitest'
import { formatBytes, getStorageProtectionStatus, requestStorageProtection } from '../../src/features/storage/storageProtection'

describe('storage protection', () => {
  it('formats browser quota values for people', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB')
  })

  it('reads usage, quota and existing persistence', async () => {
    const storage = {
      estimate: vi.fn().mockResolvedValue({ usage: 3_000, quota: 10_000 }),
      persisted: vi.fn().mockResolvedValue(true),
    }

    await expect(getStorageProtectionStatus(storage)).resolves.toEqual({
      supported: true,
      persisted: true,
      usage: 3_000,
      quota: 10_000,
    })
  })

  it('requests persistence and refreshes the storage estimate', async () => {
    const storage = {
      estimate: vi.fn().mockResolvedValue({ usage: 4_000, quota: 12_000 }),
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(true),
    }

    await expect(requestStorageProtection(storage)).resolves.toMatchObject({ supported: true, persisted: true })
    expect(storage.persist).toHaveBeenCalledOnce()
  })

  it('reports denied and unsupported requests without throwing', async () => {
    const denied = {
      estimate: vi.fn().mockResolvedValue({ usage: 1, quota: 2 }),
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    }

    await expect(requestStorageProtection(denied)).resolves.toMatchObject({ supported: true, persisted: false })
    await expect(getStorageProtectionStatus(undefined)).resolves.toEqual({
      supported: false,
      persisted: false,
      usage: null,
      quota: null,
    })
  })
})
