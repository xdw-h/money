<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ images: { id: string; url: string; name: string }[]; open: boolean; start?: number }>()
const emit = defineEmits<{ close: []; delete: [id: string] }>()
const index = ref(0)
watch(() => [props.open, props.start] as const, () => { index.value = Math.min(props.start ?? 0, Math.max(0, props.images.length - 1)) }, { immediate: true })
const current = computed(() => props.images[index.value])
function move(delta: number) { index.value = (index.value + delta + props.images.length) % props.images.length }
</script>

<template>
  <div v-if="open && current" class="gallery" role="dialog" aria-modal="true" aria-label="图片预览">
    <header><button aria-label="关闭预览" @click="emit('close')">×</button><span>{{ index + 1 }} / {{ images.length }}</span><button aria-label="删除当前图片" @click="emit('delete', current.id)">删除</button></header>
    <button class="arrow left" aria-label="上一张" @click="move(-1)">‹</button>
    <img :src="current.url" :alt="current.name" />
    <button class="arrow right" aria-label="下一张" @click="move(1)">›</button>
  </div>
</template>

<style scoped>
.gallery { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; background: #231f1ddd;backdrop-filter:blur(16px); color: white; }
.gallery header { position: absolute; top: max(16px, env(safe-area-inset-top)); left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center; }
.gallery header button, .arrow { min-width: 44px; min-height: 44px; border: 0; background: transparent; color: white; font-size: 20px; }
.gallery img { max-width: calc(100% - 44px); max-height: 72vh; object-fit: contain;border-radius:18px;box-shadow:0 20px 50px #0008 }
.arrow { position: absolute; top: 50%; font-size: 48px; }.left { left: 4px; }.right { right: 4px; }
</style>
