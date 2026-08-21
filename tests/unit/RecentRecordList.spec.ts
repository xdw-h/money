import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RecentRecordList from '../../src/features/records/RecentRecordList.vue'

describe('RecentRecordList', () => {
  it('uses the subcategory icon when a record has a subcategory', async () => {
    const now = new Date().toISOString()
    const wrapper = mount(RecentRecordList, {
      props: { records: [{ id:'record-1', type:'expense', amount:3200, categoryId:'food', subcategoryId:'food-breakfast', occurredAt:now, note:'早餐', imageIds:[], createdAt:now, updatedAt:now }] },
      global: { stubs: { ImageGallery: true } },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.category-icon').text()).toBe('🥪')
    expect(wrapper.get('article strong').text()).toContain('餐饮 · 早餐')
  })
})
