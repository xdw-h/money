import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

let lockCount = 0
let scrollY = 0
let saved: Partial<CSSStyleDeclaration> = {}

function lock() {
  lockCount += 1
  if (lockCount > 1) return
  scrollY = window.scrollY
  saved = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.body.style.overflow }
  Object.assign(document.body.style, { position: 'fixed', top: `-${scrollY}px`, width: '100%', overflow: 'hidden' })
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount) return
  Object.assign(document.body.style, saved)
  if (!/jsdom/i.test(navigator.userAgent)) window.scrollTo(0, scrollY)
}

export function useBodyScrollLock(active?: Ref<boolean>) {
  let held = false
  const update = (value: boolean) => {
    if (value && !held) { lock(); held = true }
    else if (!value && held) { unlock(); held = false }
  }
  if (active) watch(active, update, { immediate: true })
  else onMounted(() => update(true))
  onBeforeUnmount(() => update(false))
}
