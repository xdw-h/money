import { describe, expect, it } from 'vitest'
import { bundledIconGroups, bundledIconKeys } from '../../src/features/icons/bundledIconCatalog'
import { bundledIconAssets } from '../../src/features/icons/bundledIconAssets'

describe('bundled color icon catalog', () => {
  it('contains ten bookkeeping groups and about one hundred unique Fluent icons', () => {
    expect(bundledIconGroups).toHaveLength(10)
    expect(bundledIconGroups.map((group) => group.name)).toEqual([
      '餐饮', '购物', '交通', '住房', '医疗', '学习', '娱乐', '旅行', '收入', '宠物',
    ])
    expect(bundledIconKeys).toHaveLength(150)
    expect(bundledIconGroups.every((group) => group.icons.length === 15)).toBe(true)
    expect(new Set(bundledIconKeys).size).toBe(bundledIconKeys.length)
    expect(bundledIconKeys.every((key) => key.startsWith('iconify:fluent-emoji-flat:'))).toBe(true)
  })

  it('has a safe generated SVG asset for every catalog key', () => {
    expect(Object.keys(bundledIconAssets).sort()).toEqual([...bundledIconKeys].sort())
    expect(Object.values(bundledIconAssets).every((asset) => asset.body.includes('<path') && asset.width === 32 && asset.height === 32)).toBe(true)
  })
})
