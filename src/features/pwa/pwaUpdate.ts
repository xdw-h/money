import { ref } from 'vue'

export const pwaUpdateAvailable = ref(false)
export const pwaUpdateApplying = ref(false)

let registration: ServiceWorkerRegistration | undefined
let reloadStarted = false

const checkForUpdate = async () => {
  try {
    await registration?.update()
  } catch {
    // Offline checks are expected to fail; the next foreground/online check retries.
  }
}

const watchInstallingWorker = (worker: ServiceWorker | null) => {
  if (!worker) return
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      pwaUpdateAvailable.value = true
    }
  })
}

export const startPwaUpdateChecks = async () => {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

  registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    updateViaCache: 'none',
  })

  if (registration.waiting) pwaUpdateAvailable.value = true
  registration.addEventListener('updatefound', () => watchInstallingWorker(registration?.installing ?? null))
  watchInstallingWorker(registration.installing)

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadStarted) return
    reloadStarted = true
    location.reload()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForUpdate()
  })
  window.addEventListener('online', () => void checkForUpdate())
  window.setInterval(() => void checkForUpdate(), 5 * 60 * 1000)
  await checkForUpdate()
}

export const applyPwaUpdate = async () => {
  pwaUpdateApplying.value = true
  if (!registration?.waiting) await checkForUpdate()
  registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
}
