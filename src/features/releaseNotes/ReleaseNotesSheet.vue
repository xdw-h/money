<script setup lang="ts">
import { releaseNotes } from './releaseNotes'
defineEmits<{ close: [] }>()
</script>
<template>
  <div class="notes-overlay" @click.self="$emit('close')"><section class="notes-sheet" role="dialog" aria-modal="true" aria-label="版本公告">
    <header><div><strong>版本公告</strong><small>每一次更新，都有迹可循</small></div><button type="button" aria-label="关闭版本公告" @click="$emit('close')">×</button></header>
    <div class="notes-list"><article v-for="(note,index) in releaseNotes" :key="note.version" :class="{ latest: index === 0 }"><div class="version-row"><b>v{{ note.version }}</b><time :datetime="note.date">{{ note.date }}</time><em v-if="index === 0">最新</em></div><h2>{{ note.title }}</h2><ul><li v-for="item in note.items" :key="item">{{ item }}</li></ul></article></div>
  </section></div>
</template>
<style scoped>
.notes-overlay{position:fixed;z-index:150;inset:0;display:flex;align-items:flex-end;background:rgba(35,31,29,.48);backdrop-filter:blur(4px)}.notes-sheet{width:min(100%,430px);max-height:82dvh;margin:0 auto;padding:20px 18px calc(22px + env(safe-area-inset-bottom));display:grid;gap:16px;border-radius:28px 28px 0 0;background:var(--surface)}header{display:flex;align-items:center;justify-content:space-between}header div{display:grid;gap:3px}header strong{font-size:20px}header small{color:var(--muted);font-size:10px}header button{width:36px;height:36px;border:0;border-radius:50%;background:var(--surface-soft);font-size:22px}.notes-list{display:grid;gap:12px;overflow:auto}.notes-list article{padding:15px;border:1px solid var(--border);border-radius:17px;background:var(--surface-soft)}.notes-list article.latest{border-color:color-mix(in srgb,var(--primary) 35%,var(--border));background:color-mix(in srgb,var(--primary) 6%,var(--surface))}.version-row{display:flex;align-items:center;gap:8px}.version-row b{color:var(--primary);font-size:12px}.version-row time{color:var(--muted);font-size:10px}.version-row em{margin-left:auto;padding:3px 7px;border-radius:999px;background:var(--primary);color:white;font-size:9px;font-style:normal}.notes-list h2{margin:9px 0 7px;font-size:15px}.notes-list ul{margin:0;padding-left:18px;color:var(--muted);font-size:12px;line-height:1.7}
</style>
