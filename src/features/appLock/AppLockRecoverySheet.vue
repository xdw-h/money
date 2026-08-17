<script setup lang="ts">
import { ref } from 'vue'
import { db } from '../../shared/db/database'
import { clearAppDataAndLock, recoverFromBackup } from './appLockRecovery'

const emit = defineEmits<{ close: [] }>()
const phrase = ref(''); const busy = ref(false); const error = ref(''); const message = ref('')
const restore = async (event: Event) => {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return
  busy.value = true; error.value = ''
  try { await recoverFromBackup(file, db); message.value = '备份恢复成功，应用锁已重置' }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '备份恢复失败' }
  finally { busy.value = false; input.value = '' }
}
const clearAll = async () => {
  error.value = ''
  if (phrase.value !== '确认清空') { error.value = '请输入“确认清空”'; return }
  if (!window.confirm('最后确认：删除全部账目和照片并重置应用锁？')) return
  busy.value = true
  try { await clearAppDataAndLock(db, phrase.value) }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '清空失败' }
  finally { busy.value = false }
}
</script>
<template>
  <div class="recovery-overlay" @click.self="emit('close')"><section class="recovery-sheet" role="dialog" aria-modal="true" aria-label="应用锁恢复">
    <header><strong>忘记密码或手势</strong><button type="button" aria-label="关闭恢复窗口" @click="emit('close')">×</button></header>
    <p>应用锁无法找回。你可以导入有效备份恢复，或者清空本机数据。</p>
    <label class="restore-button">{{ busy ? '处理中…' : '导入 ZIP 备份并重置' }}<input type="file" accept=".zip,application/zip" :disabled="busy" @change="restore" /></label>
    <div class="danger-zone"><b>清空本地数据</b><small>将永久删除账目、照片、分类和账本</small><input v-model="phrase" placeholder="请输入：确认清空" aria-label="清空确认文字" /><button type="button" :disabled="busy" @click="clearAll">清空并重置应用锁</button></div>
    <p v-if="message" class="success">{{ message }}</p><p v-if="error" class="error" role="alert">{{ error }}</p>
  </section></div>
</template>
<style scoped>
.recovery-overlay{position:fixed;z-index:230;inset:0;display:flex;align-items:flex-end;background:rgba(30,27,26,.55);backdrop-filter:blur(4px)}.recovery-sheet{width:min(100%,430px);margin:0 auto;padding:20px 20px calc(24px + env(safe-area-inset-bottom));display:grid;gap:14px;border-radius:28px 28px 0 0;background:var(--surface)}header{display:flex;align-items:center;justify-content:space-between}header strong{font-size:18px}header button{width:36px;height:36px;border:0;border-radius:50%;background:var(--surface-soft);font-size:22px}.recovery-sheet>p{margin:0;color:var(--muted);font-size:12px;line-height:1.6}.restore-button{position:relative;min-height:48px;display:grid;place-items:center;overflow:hidden;border-radius:14px;background:var(--primary);color:white;font-weight:700}.restore-button input{position:absolute;inset:0;opacity:0}.danger-zone{padding:14px;display:grid;gap:9px;border:1px solid color-mix(in srgb,var(--expense) 25%,var(--border));border-radius:16px;background:color-mix(in srgb,var(--expense) 5%,var(--surface))}.danger-zone small{color:var(--muted);font-size:10px}.danger-zone input{height:44px;padding:0 12px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}.danger-zone button{height:43px;border:0;border-radius:11px;background:var(--expense);color:white;font-weight:700}.success{color:var(--income)!important}.error{color:var(--expense)!important}
</style>
