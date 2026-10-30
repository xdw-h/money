import JSZip from 'jszip'
import type { BookkeepingDatabase } from '../../shared/db/database'
import { imageExtension } from '../images/imageService'
import type { BackupData, BackupManifest } from './types'
import { normalizeCycleAnchorDate, normalizeCycleEndDates, normalizeCycleStartDates } from '../ledgers/cycleAnchorDate'
import { isSafeIconBody, parseIconKey } from '../icons/iconService'
import type { IconAsset } from '../icons/types'
import { isBundledIconKey } from '../icons/bundledIconCatalog'
import { validateSavingsDeposit, validateSavingsPlan } from '../savings/savingsService'

function blobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof (blob as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === 'function') {
    return (blob as Blob & { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer().then((value) => new Uint8Array(value))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('文件读取失败'))
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.readAsArrayBuffer(blob)
  })
}

export async function exportBackup(database: BookkeepingDatabase): Promise<Blob> {
  const [records, categories, images, ledgers, savingsPlans, savingsDeposits] = await Promise.all([
    database.records.toArray(), database.categories.toArray(), database.images.toArray(), database.ledgers.toArray(),
    database.savingsPlans.toArray(), database.savingsDeposits.toArray(),
  ])
  const zip = new JSZip()
  const referencedIconKeys = new Set([...categories.map(({ icon }) => icon), ...ledgers.map(({ icon }) => icon)].filter((icon) => parseIconKey(icon) && !isBundledIconKey(icon)))
  const iconAssets = (await database.iconAssets.bulkGet([...referencedIconKeys])).filter((asset): asset is IconAsset => Boolean(asset))
  const manifest: BackupManifest = { version: 2, createdAt: new Date().toISOString(), records: records.length, images: images.length }
  const imageMetadata: BackupData['images'] = []
  for (const image of images) {
    const file = `images/${image.id}.${imageExtension(image.mimeType)}`
    zip.file(file, await blobBytes(image.blob))
    imageMetadata.push({
      id: image.id, recordId: image.recordId, name: image.name, mimeType: image.mimeType,
      size: image.size, createdAt: image.createdAt, file,
    })
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  zip.file('records.json', JSON.stringify({ records, categories, ledgers, savingsPlans, savingsDeposits, images: imageMetadata } satisfies BackupData, null, 2))
  zip.file('icons.json', JSON.stringify(iconAssets, null, 2))
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  return new Blob([bytes as BlobPart], { type: 'application/zip' })
}

function validateData(manifest: BackupManifest, data: BackupData) {
  if (manifest.version !== 1 && manifest.version !== 2) throw new Error('备份版本不兼容')
  if (!Array.isArray(data.records) || !Array.isArray(data.images) || !Array.isArray(data.categories)) throw new Error('备份数据结构错误')
  if (manifest.records !== data.records.length || manifest.images !== data.images.length) throw new Error('备份清单与内容不一致')
  const imageIds = new Set(data.images.map(({ id }) => id))
  if (data.records.some((record) => record.imageIds.some((id) => !imageIds.has(id)))) throw new Error('备份缺少账目关联图片')
  if (data.savingsPlans !== undefined && !Array.isArray(data.savingsPlans) || data.savingsDeposits !== undefined && !Array.isArray(data.savingsDeposits)) throw new Error('存钱计划备份结构错误')
  const plans = data.savingsPlans ?? []; const deposits = data.savingsDeposits ?? []
  plans.forEach(validateSavingsPlan); deposits.forEach(validateSavingsDeposit)
  const planIds = new Set(plans.map(plan => plan.id))
  if (planIds.size !== plans.length || new Set(deposits.map(item => item.id)).size !== deposits.length) throw new Error('存钱计划备份包含重复记录')
  if (deposits.some(item => !planIds.has(item.planId))) throw new Error('备份缺少存入记录所属计划')
}

export async function importBackup(file: Blob, database: BookkeepingDatabase) {
  const zip = await JSZip.loadAsync(await blobBytes(file))
  const manifestEntry = zip.file('manifest.json'); const dataEntry = zip.file('records.json')
  if (!manifestEntry || !dataEntry) throw new Error('不是有效的记账备份文件')
  const manifest = JSON.parse(await manifestEntry.async('string')) as BackupManifest
  if (manifest.version !== 1 && manifest.version !== 2) throw new Error('备份版本不兼容')
  const data = JSON.parse(await dataEntry.async('string')) as BackupData
  validateData(manifest, data)
  const iconEntry = zip.file('icons.json')
  if (manifest.version === 2 && !iconEntry) throw new Error('备份缺少图标数据')
  const restoredIcons = iconEntry ? JSON.parse(await iconEntry.async('string')) as IconAsset[] : []
  if (!Array.isArray(restoredIcons) || restoredIcons.some((asset) => !parseIconKey(asset.key) || !isSafeIconBody(asset.body))) throw new Error('备份图标数据不安全')
  const preparedImages = await Promise.all(data.images.map(async (image) => {
    const entry = zip.file(image.file); if (!entry) throw new Error(`备份缺少图片：${image.name}`)
    const blob = await entry.async('blob')
    return { ...image, blob, thumbnailBlob: blob }
  }))
  let imported = 0; let skipped = 0; let imageCount = 0
  let savingsPlanCount = 0; let savingsDepositCount = 0
  await database.transaction('rw', [database.records, database.images, database.categories, database.ledgers, database.iconAssets, database.savingsPlans, database.savingsDeposits], async () => {
    for (const plan of data.savingsPlans ?? []) if (!await database.savingsPlans.get(plan.id)) { await database.savingsPlans.add(plan); savingsPlanCount++ }
    for (const deposit of data.savingsDeposits ?? []) if (!await database.savingsDeposits.get(deposit.id)) { await database.savingsDeposits.add(deposit); savingsDepositCount++ }
    const restoredLedgers = data.ledgers?.length ? data.ledgers : [{ id: 'default-ledger', name: '日常账本', icon: '📒', cycleAnchorDate: normalizeCycleAnchorDate(undefined), createdAt: new Date().toISOString() }]
    for (const ledger of restoredLedgers) {
      const { cycleStartDay, ...restored } = ledger
      await database.ledgers.put({ ...restored, cycleAnchorDate: normalizeCycleAnchorDate(ledger.cycleAnchorDate, cycleStartDay), cycleStartDates: normalizeCycleStartDates(ledger.cycleStartDates), cycleEndDates: normalizeCycleEndDates(ledger.cycleEndDates) })
    }
    for (const category of data.categories) await database.categories.put(category)
    if (restoredIcons.length) await database.iconAssets.bulkPut(restoredIcons)
    for (const record of data.records) {
      if (await database.records.get(record.id)) { skipped++; continue }
      const recordImages = preparedImages.filter((image) => image.recordId === record.id)
      await database.records.add({ ...record, ledgerId: record.ledgerId ?? 'default-ledger' })
      if (recordImages.length) await database.images.bulkAdd(recordImages)
      imported++; imageCount += recordImages.length
    }
  })
  return { imported, skipped, images: imageCount, ...(data.savingsPlans?.length || data.savingsDeposits?.length ? { savingsPlans: savingsPlanCount, savingsDeposits: savingsDepositCount } : {}) }
}
