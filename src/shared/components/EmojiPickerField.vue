<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import Picker from 'emoji-picker-element/picker'
import zhCN from 'emoji-picker-element/i18n/zh_CN'
import emojiDataUrl from 'emoji-picker-element-data/zh/emojibase/data.json?url'

const props = defineProps<{ modelValue: string; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const open = ref(false)
const host = ref<HTMLElement>()

function close() {
  open.value = false
  if (host.value) host.value.replaceChildren()
}

async function showPicker() {
  open.value = true
  await nextTick()
  if (!host.value || host.value.childElementCount) return
  const picker = new Picker({ dataSource: emojiDataUrl, locale: 'zh', i18n: zhCN })
  picker.addEventListener('emoji-click', (event) => {
    const emoji = event.detail.unicode
    if (emoji) emit('update:modelValue', emoji)
    close()
  })
  host.value.append(picker)
}

onBeforeUnmount(close)
</script>

<template>
  <button class="emoji-trigger" type="button" :aria-label="`选择${label}`" @click="showPicker">
    <span>{{ props.modelValue }}</span><small>{{ label }}</small><em>更换 ›</em>
  </button>
  <div v-if="open" class="emoji-overlay" @click.self="close">
    <section class="emoji-sheet" role="dialog" aria-modal="true" :aria-label="`选择${label}`">
      <header><strong>选择{{ label }}</strong><button type="button" aria-label="关闭图标选择器" @click="close">×</button></header>
      <div ref="host" class="emoji-host" />
    </section>
  </div>
</template>

<style scoped>
.emoji-trigger{width:100%;min-height:48px;padding:7px 10px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:9px;border:1px solid var(--border);border-radius:13px;background:var(--surface-soft);text-align:left}.emoji-trigger span{font-size:24px;text-align:center}.emoji-trigger small{color:var(--muted);font-size:11px}.emoji-trigger em{color:var(--primary);font-size:11px;font-style:normal}.emoji-overlay{position:fixed;z-index:120;inset:0;display:flex;align-items:flex-end;background:rgba(48,42,39,.45);backdrop-filter:blur(2px)}.emoji-sheet{width:min(100%,430px);margin:0 auto;padding:14px 14px calc(16px + var(--safe-bottom));border-radius:26px 26px 0 0;background:var(--surface);box-shadow:0 -16px 45px rgba(42,31,25,.2)}.emoji-sheet header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.emoji-sheet header strong{font-size:16px}.emoji-sheet header button{width:34px;height:34px;border:0;border-radius:50%;background:var(--surface-soft);color:var(--muted);font-size:21px}.emoji-host{height:min(420px,62vh)}.emoji-host :deep(emoji-picker){width:100%;height:100%;--background:var(--surface);--border-color:var(--border);--input-border-color:var(--border);--input-font-color:var(--text);--input-placeholder-color:var(--muted);--indicator-color:var(--primary);--button-active-background:var(--primary-soft);--button-hover-background:var(--surface-soft);--border-radius:14px}
</style>
