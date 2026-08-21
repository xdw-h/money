import { mount } from '@vue/test-utils'
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/shared/db/database'
import EmojiPickerField from '../../src/shared/components/EmojiPickerField.vue'

describe('EmojiPickerField', () => {
  afterEach(async () => { vi.unstubAllGlobals(); await db.iconAssets.clear() })

  it('opens the curated icon library and emits the selected icon', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ width: 32, height: 32, icons: { 'money-bag': { body: '<path fill="#ff0" d="M1 1h2"/>' } } }) })))
    const wrapper = mount(EmojiPickerField, { props: { modelValue: '📒', label: '账本图标' }, global: { stubs: { teleport: true } } })
    await wrapper.get('button[aria-label="选择账本图标"]') .trigger('click')
    expect(wrapper.text()).toContain('餐饮')
    await wrapper.get('button[aria-label="选择图标 iconify:fluent-emoji-flat:money-bag"]').trigger('click')

    await vi.waitFor(() => expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['iconify:fluent-emoji-flat:money-bag']))
    expect(document.body.style.position).toBe('')
  })

  it('locks the page behind the icon sheet and restores it when cancelled', async () => {
    const wrapper = mount(EmojiPickerField, { props: { modelValue: '📒', label: '账本图标' }, global: { stubs: { teleport: true } } })
    await wrapper.get('button[aria-label="选择账本图标"]').trigger('click')
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.get('.cancel-picker').trigger('click')
    expect(document.body.style.position).toBe('')
    expect(document.body.style.overflow).toBe('')
  })

  it('closes when the backdrop itself is clicked', async () => {
    const wrapper = mount(EmojiPickerField, { props: { modelValue: '📒', label: '账本图标' }, global: { stubs: { teleport: true } } })
    await wrapper.get('button[aria-label="选择账本图标"]').trigger('click')
    await wrapper.get('.emoji-overlay').trigger('click')
    expect(wrapper.find('.emoji-overlay').exists()).toBe(false)
  })

  it('shows only categorized bundled icons without search or source tabs', async () => {
    const wrapper = mount(EmojiPickerField, { props: { modelValue: '📒', label: '分类图标' }, global: { stubs: { teleport: true } } })
    await wrapper.get('button[aria-label="选择分类图标"]').trigger('click')
    expect(wrapper.find('form[role="search"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-icon-tab]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Emoji')
    expect(wrapper.text()).not.toContain('在线')
    expect(wrapper.findAll('[data-bundled-icon-group]')).toHaveLength(10)
  })

  it('shows ten bundled bookkeeping groups and selects one while offline', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetcher)
    const wrapper = mount(EmojiPickerField, { props: { modelValue: '📒', label: '分类图标' }, global: { stubs: { teleport: true } } })
    await wrapper.get('button[aria-label="选择分类图标"]').trigger('click')
    expect(wrapper.findAll('[data-bundled-icon-group]')).toHaveLength(10)
    expect(wrapper.text()).toContain('餐饮')
    expect(wrapper.text()).toContain('宠物')
    await wrapper.get('button[aria-label="选择图标 iconify:fluent-emoji-flat:hamburger"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['iconify:fluent-emoji-flat:hamburger'])
    expect(fetcher).not.toHaveBeenCalled()
  })

})
