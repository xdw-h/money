import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import './styles/base.css'
import { applyTheme, getThemeId } from './features/theme/themeStore'
import { startPwaUpdateChecks } from './features/pwa/pwaUpdate'

applyTheme(getThemeId())

createApp(App).use(createPinia()).use(router).mount('#app')

window.addEventListener('load', () => void startPwaUpdateChecks())

window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('money-chunk-reloaded')) return
  sessionStorage.setItem('money-chunk-reloaded', '1')
  location.reload()
})
