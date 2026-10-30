import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { useLocalToday } from '../../src/shared/ui/useLocalToday'

afterEach(() => vi.useRealTimers())
it('refreshes the local calendar day at midnight and after returning to the app', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 30, 23, 59, 59))
  const wrapper = mount({ setup() { return { today: useLocalToday() } }, template:'<span>{{ today }}</span>' })
  expect(wrapper.text()).toBe('2026-10-30')
  await vi.advanceTimersByTimeAsync(1100)
  expect(wrapper.text()).toBe('2026-10-31')
  vi.setSystemTime(new Date(2026, 10, 2, 8))
  document.dispatchEvent(new Event('visibilitychange'))
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toBe('2026-11-02')
  wrapper.unmount()
  expect(vi.getTimerCount()).toBe(0)
})
