<script setup lang="ts">
import { ref, watch } from 'vue'
import { db } from '../db/database'
import { fetchIconAsset, parseIconKey } from '../../features/icons/iconService'
import type { IconAsset } from '../../features/icons/types'
const props = withDefaults(defineProps<{ icon: string; fallback?: string }>(), { fallback: '✦' })
const asset = ref<IconAsset | null>(null)
watch(() => props.icon, async (icon) => {
  asset.value = null
  if (!parseIconKey(icon)) return
  try {
    if (icon.startsWith('iconify:fluent-emoji-flat:')) {
      const { bundledIconAssets } = await import('../../features/icons/bundledIconAssets')
      if (bundledIconAssets[icon]) { asset.value = bundledIconAssets[icon]; return }
    }
    asset.value = await db.iconAssets.get(icon) ?? await fetchIconAsset(icon)
  } catch { asset.value = null }
}, { immediate: true })
</script>
<template><svg v-if="asset" class="icon-display" :viewBox="`0 0 ${asset.width} ${asset.height}`" aria-hidden="true" v-html="asset.body"></svg><span v-else class="icon-display icon-display--text" aria-hidden="true">{{ parseIconKey(icon) ? fallback : icon }}</span></template>
<style scoped>.icon-display{width:1em;height:1em;display:inline-block;overflow:visible;fill:currentColor;vertical-align:-.12em}.icon-display--text{width:auto;height:auto;line-height:1}</style>
