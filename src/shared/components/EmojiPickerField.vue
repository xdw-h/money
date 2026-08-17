<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{ modelValue: string; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const open = ref(false)
const iconGroups = [
  { name: '餐饮', icons: ['🍽️','🍜','🍚','🍱','🍲','🥪','🍔','🍕','🥗','☕','🧋','🍪'] },
  { name: '购物生活', icons: ['🛒','🛍️','👕','👟','👜','⌚','💄','🧴','🧻','🧹','🍳','📦'] },
  { name: '住房交通', icons: ['🏠','🏢','🏨','🛏️','🔑','💡','🚗','🚕','🚌','🚇','✈️','⛽','🅿️','🎫'] },
  { name: '医疗学习', icons: ['💊','🩺','🦷','🏥','📋','📚','📖','🎓','📝','✏️','💻','🎧'] },
  { name: '娱乐人情', icons: ['🎮','🎬','🎵','🎤','🎡','🏸','🎁','🧧','❤️','👪','🎉','🏅'] },
  { name: '收入账本', icons: ['📒','📔','📕','📗','📘','📙','🧾','💳','💰','🪙','📈','📊','🏡','🐱'] },
]
function choose(icon: string) { emit('update:modelValue', icon); open.value = false }
function close() { open.value = false }
function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape' && open.value) close() }
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <button class="emoji-trigger" type="button" :aria-label="`选择${label}`" @click="open = true"><span>{{ modelValue }}</span><small>{{ label }}</small><em>更换 ›</em></button>
  <div v-if="open" class="emoji-overlay" @click.self="close"><section class="emoji-sheet" role="dialog" aria-modal="true" :aria-label="`选择${label}`"><header><div><strong>选择{{ label }}</strong><small>常用记账图标</small></div><button type="button" aria-label="关闭图标选择器" @click="close">×</button></header><div class="icon-groups"><section v-for="group in iconGroups" :key="group.name"><h3>{{ group.name }}</h3><div><button v-for="icon in group.icons" :key="icon" type="button" :class="{ selected: modelValue === icon }" :aria-label="`选择图标 ${icon}`" @click="choose(icon)">{{ icon }}<b v-if="modelValue === icon">✓</b></button></div></section></div><button class="cancel-picker" type="button" @click="close">取消</button></section></div>
</template>

<style scoped>
.emoji-trigger{width:100%;min-height:48px;padding:7px 10px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:9px;border:1px solid var(--border);border-radius:13px;background:var(--surface-soft);text-align:left}.emoji-trigger span{font-size:24px;text-align:center}.emoji-trigger small{color:var(--muted);font-size:11px}.emoji-trigger em{color:var(--primary);font-size:11px;font-style:normal}.emoji-overlay{position:fixed;z-index:120;inset:0;display:flex;align-items:flex-end;background:rgba(48,42,39,.45);backdrop-filter:blur(2px)}.emoji-sheet{width:min(100%,430px);max-height:76vh;margin:0 auto;padding:14px 14px calc(12px + var(--safe-bottom));overflow:hidden;border-radius:26px 26px 0 0;background:var(--surface);box-shadow:0 -16px 45px rgba(42,31,25,.2)}.emoji-sheet>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.emoji-sheet>header>div{display:grid;gap:2px}.emoji-sheet header strong{font-size:16px}.emoji-sheet header small{color:var(--muted);font-size:9px}.emoji-sheet header button{width:34px;height:34px;border:0;border-radius:50%;background:var(--surface-soft);color:var(--muted);font-size:21px}.icon-groups{max-height:calc(76vh - 116px);overflow:auto}.icon-groups section{padding:7px 0}.icon-groups h3{margin:0 0 7px;color:var(--muted);font-size:10px;font-weight:600}.icon-groups section>div{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.icon-groups section button{position:relative;aspect-ratio:1;padding:0;border:1px solid transparent;border-radius:11px;background:var(--surface-soft);font-size:21px}.icon-groups section button.selected{border-color:var(--primary);background:var(--primary-soft)}.icon-groups b{position:absolute;right:2px;bottom:1px;color:var(--primary);font-size:8px}.cancel-picker{width:100%;min-height:42px;margin-top:8px;border:0;border-radius:12px;background:var(--surface-soft);color:var(--text);font-size:13px;font-weight:700}
</style>
