<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import { applyPwaUpdate, pwaUpdateApplying, pwaUpdateAvailable } from './features/pwa/pwaUpdate'
import AppLockScreen from './features/appLock/AppLockScreen.vue'
import { appUnlocked, lockApp, markBackgrounded, requiresUnlock } from './features/appLock/appLockStore'
import AppLockRecoverySheet from './features/appLock/AppLockRecoverySheet.vue'
import ReleaseNotesSheet from './features/releaseNotes/ReleaseNotesSheet.vue'
import { markLatestReleaseViewed, shouldShowLatestRelease } from './features/releaseNotes/releaseNotes'
const route = useRoute()
const hideNav = computed(() => Boolean(route.meta.hideNav))
const showLockRecovery = ref(false)
const showReleaseNotes = ref(false)
watch(appUnlocked, (unlocked) => { if (unlocked && shouldShowLatestRelease()) showReleaseNotes.value = true }, { immediate: true })
const closeReleaseNotes = () => { markLatestReleaseViewed(); showReleaseNotes.value = false }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') markBackgrounded()
  else if (requiresUnlock()) lockApp()
})
</script>

<template>
  <div class="app-shell" :class="{ 'without-nav': hideNav }">
    <AppLockScreen v-if="!appUnlocked" @recover="showLockRecovery = true" />
    <AppLockRecoverySheet v-if="showLockRecovery && !appUnlocked" @close="showLockRecovery = false" />
    <RouterView v-if="appUnlocked" />
    <ReleaseNotesSheet v-if="appUnlocked && showReleaseNotes" @close="closeReleaseNotes" />
    <aside v-if="pwaUpdateAvailable" class="update-toast" role="status" aria-live="polite">
      <span><strong>发现新版本</strong><small>更新后即可使用最新功能</small></span>
      <button type="button" :disabled="pwaUpdateApplying" @click="applyPwaUpdate">
        {{ pwaUpdateApplying ? '更新中…' : '立即更新' }}
      </button>
    </aside>
    <nav v-if="appUnlocked && !hideNav" class="bottom-nav" aria-label="主导航">
      <svg class="bottom-nav__outline" viewBox="0 0 430 128" preserveAspectRatio="none" aria-hidden="true">
        <path d="M22 60 H163 C180 60 190 34 215 34 C240 34 250 60 267 60 H408 Q418 60 418 70 V111 Q418 121 408 121 H22 Q12 121 12 111 V70 Q12 60 22 60 Z" />
      </svg>

      <RouterLink to="/">
        <svg class="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5V21H3Z" />
          <path d="M9.7 21v-4.4a2.3 2.3 0 0 1 4.6 0V21" />
        </svg>
        <span>首页</span>
      </RouterLink>
      <RouterLink to="/bills">
        <svg class="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 9h6M9 14h3M15 14h1" />
        </svg>
        <span>账单</span>
      </RouterLink>
      <RouterLink class="add-record" to="/record/new" aria-label="新增记账">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5v22M5 16h22" /></svg>
      </RouterLink>
      <RouterLink to="/timeline">
        <svg class="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5h4" />
        </svg>
        <span>时间轴</span>
      </RouterLink>
      <RouterLink to="/settings">
        <svg class="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9.4 3.7 10 2h4l.6 1.7 1.7.7 1.6-.8 2.8 2.8-.8 1.6.7 1.7 1.7.6v4l-1.7.6-.7 1.7.8 1.6-2.8 2.8-1.6-.8-1.7.7L14 22h-4l-.6-1.7-1.7-.7-1.6.8-2.8-2.8.8-1.6-.7-1.7-1.7-.6v-4l1.7-.6.7-1.7-.8-1.6 2.8-2.8 1.6.8Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>设置</span>
      </RouterLink>
    </nav>
  </div>
</template>
