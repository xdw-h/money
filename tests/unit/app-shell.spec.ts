import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.vue'

describe('app shell', () => {
  it('renders mobile navigation and the central record action', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>首页内容</div>' } },
        { path: '/bills', component: { template: '<div>账单内容</div>' } },
        { path: '/record/new', component: { template: '<div>新增内容</div>' } },
        { path: '/settings', component: { template: '<div>设置内容</div>' } },
      ],
    })
    const wrapper = mount(App, { global: { plugins: [router] } })
    await router.isReady()

    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('账单')
    expect(wrapper.text()).toContain('设置')
    expect(wrapper.get('[aria-label="新增记账"]')).toBeTruthy()
  })
})
