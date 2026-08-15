import { ref } from 'vue'
import { db } from '../../shared/db/database'
import { createId } from '../../shared/id/createId'
import { categories as defaultCategories } from './categories'
import type { CategoryEntity, RecordType } from './types'

export const categoryItems = ref<CategoryEntity[]>([...defaultCategories])
let loaded = false

export async function loadCategories() {
  if (loaded) return categoryItems.value
  if (typeof indexedDB === 'undefined') return categoryItems.value
  const saved = await db.categories.toArray()
  const defaultMap = new Map(defaultCategories.map((item) => [item.id, item]))
  const migrated = saved.map((item) => {
    const next = defaultMap.get(item.id)
    if (!next || item.parentId) return item
    const isLegacy = (item.id === 'health' && item.name === '健康') ||
      (item.id === 'daily' && item.name === '日用') ||
      ['food', 'shopping', 'transport'].includes(item.id)
    return isLegacy ? { ...item, name: next.name, icon: next.icon, order: next.order } : item
  })
  const legacyIds = ['vegetable', 'fruit', 'snack']
  const removableLegacyIds: string[] = []
  for (const id of legacyIds) {
    const used = await db.records.filter((record) => record.categoryId === id || record.subcategoryId === id).count()
    if (!used && !saved.some((item) => item.parentId === id)) removableLegacyIds.push(id)
  }
  const retained = migrated.filter((item) => !removableLegacyIds.includes(item.id))
  if (removableLegacyIds.length) await db.categories.bulkDelete(removableLegacyIds)
  const changed = retained.filter((item) => {
    const old = saved.find(({ id }) => id === item.id)
    return old && (old.name !== item.name || old.icon !== item.icon || old.order !== item.order)
  })
  if (changed.length) await db.categories.bulkPut(changed)
  const savedIds = new Set(retained.map(({ id }) => id))
  const missingDefaults = defaultCategories.filter(({ id }) => !savedIds.has(id))
  if (missingDefaults.length) await db.categories.bulkPut(missingDefaults)
  categoryItems.value = [...retained, ...missingDefaults].sort((a, b) => a.type.localeCompare(b.type) || a.order - b.order)
  loaded = true
  return categoryItems.value
}

export async function addCategory(type: RecordType, name: string, icon: string, parentId?: string) {
  const normalizedName = name.trim().slice(0, 8)
  if (!normalizedName) throw new Error('请输入分类名称')
  const duplicate = categoryItems.value.some((item) => item.type === type && item.parentId === parentId && item.name === normalizedName)
  if (duplicate) throw new Error('该分类已存在')
  const order = Math.max(0, ...categoryItems.value.filter((item) => item.type === type && item.parentId === parentId).map((item) => item.order)) + 1
  const category: CategoryEntity = { id: `custom-${createId()}`, type, name: normalizedName, icon, order, ...(parentId ? { parentId } : {}) }
  await db.categories.add(category)
  categoryItems.value = [...categoryItems.value, category]
  return category
}

export async function updateCategory(id: string, name: string, icon: string) {
  const current = categoryItems.value.find((item) => item.id === id)
  if (!current) throw new Error('分类不存在')
  const normalizedName = name.trim().slice(0, 8)
  if (!normalizedName) throw new Error('请输入分类名称')
  const duplicate = categoryItems.value.some((item) => item.id !== id && item.type === current.type && item.parentId === current.parentId && item.name === normalizedName)
  if (duplicate) throw new Error('该分类已存在')
  const updated = { ...current, name: normalizedName, icon }
  await db.categories.put(updated)
  categoryItems.value = categoryItems.value.map((item) => item.id === id ? updated : item)
  return updated
}

export async function deleteCategory(id: string) {
  const current = categoryItems.value.find((item) => item.id === id)
  if (!current) throw new Error('分类不存在')
  if (categoryItems.value.some((item) => item.parentId === id)) throw new Error('请先删除该分类下的子类')
  if (await db.records.filter((record) => record.categoryId === id || record.subcategoryId === id).count()) throw new Error('该分类已有账目，不能删除')
  await db.categories.delete(id)
  categoryItems.value = categoryItems.value.filter((item) => item.id !== id)
}

export const categoryIcons = [
  '🍽️', '🍜', '🍚', '🍱', '🍲', '🥪', '🍪', '☕',
  '🛒', '🛍️', '👕', '👟', '👜', '⌚', '💄', '💋',
  '🏠', '🏢', '🏨', '🛏️', '🔑', '💡', '🧹', '🍳',
  '🚗', '🚕', '🚌', '🚇', '✈️', '⛽', '🅿️', '🎫',
  '🎮', '🎬', '🎵', '🎤', '🎡', '🏸', '📚', '📖',
  '🎓', '📝', '✏️', '💊', '🩺', '🦷', '🏥', '📋',
  '🎁', '🧧', '❤️', '👪', '🎉', '🏅', '💡', '📱',
  '💻', '🎧', '📺', '☎️', '📡', '📶', '☁️', '🔧',
  '🛠️', '📦', '📮', '🖨️', '🧾', '🧻', '🧴', '💇',
  '🧖', '💳', '💰', '🪙', '📈', '📊', '🏡', '🐱',
]
