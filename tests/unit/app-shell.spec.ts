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
        { path: '/timeline', component: { template: '<div>时间轴内容</div>' } },
        { path: '/statistics', component: { template: '<div>统计内容</div>' } },
        { path: '/ledgers', component: { template: '<div>账本内容</div>' } },
        { path: '/settings', component: { template: '<div>设置内容</div>' } },
      ],
    })
    const wrapper = mount(App, { global: { plugins: [router] } })
    await router.isReady()

    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('账单')
    expect(wrapper.text()).toContain('时间轴')
    expect(wrapper.text()).toContain('设置')
    expect(wrapper.get('[aria-label="新增记账"]')).toBeTruthy()
    expect(wrapper.findAll('.bottom-nav__outline')).toHaveLength(1)
    expect(wrapper.findAll('.bottom-nav__outline path')).toHaveLength(1)
    expect(wrapper.get('.bottom-nav__outline path').attributes('d')).toContain('H163 C180 60 190 34 215 34 C240 34 250 60 267 60')
    expect(wrapper.findAll('.bottom-nav__icon')).toHaveLength(4)
    expect(wrapper.findAll('[data-icon]')).toHaveLength(0)
  })
})
