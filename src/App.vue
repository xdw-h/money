<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
const route = useRoute()
const hideNav = computed(() => Boolean(route.meta.hideNav))
</script>

<template>
  <div class="app-shell" :class="{ 'without-nav': hideNav }">
    <RouterView />
    <nav v-if="!hideNav" class="bottom-nav" aria-label="主导航">
      <RouterLink to="/" data-icon="⌂">首页</RouterLink>
      <RouterLink to="/bills" data-icon="▤">账单</RouterLink>
      <RouterLink class="add-record" to="/record/new" aria-label="新增记账">＋</RouterLink>
      <RouterLink to="/bills?view=statistics" data-icon="◔">统计</RouterLink>
      <RouterLink to="/settings" data-icon="⚙">设置</RouterLink>
    </nav>
  </div>
</template>
