import 'fake-indexeddb/auto'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LedgerEntity } from '../../src/features/records/types'

vi.mock('../../src/shared/db/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/shared/db/database')>()
  return {
    ...actual,
    db: new actual.BookkeepingDatabase(`ledger-store-${crypto.randomUUID()}`),
  }
})

import { db } from '../../src/shared/db/database'
import {
  ledgerItems,
  setLedgerCycleEndDate,
  setLedgerCycleStartDate,
  updateLedger,
} from '../../src/features/ledgers/ledgerStore'

const ledger: LedgerEntity = {
  id: 'ledger-test',
  name: '日常账本',
  icon: '📒',
  cycleAnchorDate: '2026-08-06',
  cycleStartDates: { '2026-08': '2026-08-06' },
  cycleEndDates: { '2026-08': '2026-09-05' },
  createdAt: '2026-08-01T00:00:00.000Z',
}

describe('ledger store IndexedDB persistence', () => {
  beforeEach(async () => {
    await db.ledgers.clear()
    await db.ledgers.add(structuredClone(ledger))
    ledgerItems.value = [structuredClone(ledger)]
  })

  afterAll(async () => {
    await db.delete()
  })

  it('saves a selected cycle start date from reactive state', async () => {
    await expect(setLedgerCycleStartDate(ledger.id, '2026-08', '2026-08-13')).resolves.toBeUndefined()

    expect((await db.ledgers.get(ledger.id))?.cycleStartDates?.['2026-08']).toBe('2026-08-13')
  })

  it('saves a selected cycle end date from reactive state', async () => {
    await expect(setLedgerCycleEndDate(ledger.id, '2026-08', '2026-09-12')).resolves.toBeUndefined()

    expect((await db.ledgers.get(ledger.id))?.cycleEndDates?.['2026-08']).toBe('2026-09-12')
  })

  it('saves a changed default cycle date without reactive values', async () => {
    await expect(updateLedger(ledger.id, ledger.name, ledger.icon, '2026-08-15')).resolves.toBeUndefined()

    expect((await db.ledgers.get(ledger.id))?.cycleAnchorDate).toBe('2026-08-15')
  })
})
