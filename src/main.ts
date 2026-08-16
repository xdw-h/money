import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import './styles/base.css'
import { applyTheme, getThemeId } from './features/theme/themeStore'

applyTheme(getThemeId())

createApp(App).use(createPinia()).use(router).mount('#app')

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
    await registration.update()
  })
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (sessionStorage.getItem('money-sw-reloaded')) return
    sessionStorage.setItem('money-sw-reloaded', '1')
    location.reload()
  })
}

window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('money-chunk-reloaded')) return
  sessionStorage.setItem('money-chunk-reloaded', '1')
  location.reload()
})
