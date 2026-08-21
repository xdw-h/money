import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import IconDisplay from '../../src/shared/components/IconDisplay.vue'
import { db } from '../../src/shared/db/database'

describe('IconDisplay', () => {
  afterEach(async () => { vi.unstubAllGlobals(); await db.iconAssets.clear() })

  it('renders legacy Emoji unchanged', () => {
    const wrapper = mount(IconDisplay, { props: { icon: '📒' } })
    expect(wrapper.text()).toBe('📒')
  })

  it('renders a cached Iconify asset as SVG', async () => {
    await db.iconAssets.put({ key:'iconify:mdi:coffee', prefix:'mdi', name:'coffee', body:'<path d="M1 1h2"/>', width:24, height:24, cachedAt:new Date().toISOString() })
    const wrapper = mount(IconDisplay, { props: { icon: 'iconify:mdi:coffee' } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.html()).toContain('M1 1h2')
  })

  it('renders a bundled colored icon without network or IndexedDB cache', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetcher)
    const wrapper = mount(IconDisplay, { props: { icon: 'iconify:fluent-emoji-flat:hamburger' } })
    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))
    expect(wrapper.html()).toContain('fill=')
    expect(fetcher).not.toHaveBeenCalled()
    expect(await db.iconAssets.get('iconify:fluent-emoji-flat:hamburger')).toBeUndefined()
  })
})
