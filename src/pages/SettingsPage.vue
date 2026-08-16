<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { db } from '../shared/db/database'
import { exportBackup, importBackup } from '../features/backup/backupService'
import { formatDateTime } from '../shared/format/date'
import { appThemes, applyTheme, getThemeId, type ThemeId } from '../features/theme/themeStore'
import { activeLedgerId, addLedger, deleteLedger, ledgerItems, loadLedgers, setActiveLedger, updateLedger } from '../features/ledgers/ledgerStore'

const message = ref(''); const error = ref(''); const busy = ref(false)
const selectedTheme = ref<ThemeId>(getThemeId())
function selectTheme(id: ThemeId) { selectedTheme.value = id; applyTheme(id) }
onMounted(loadLedgers)
async function createLedger() { const name = prompt('新账本名称'); if (!name) return; try { await addLedger(name) } catch (reason) { error.value = reason instanceof Error ? reason.message : '新增账本失败' } }
async function renameLedger(id: string, current: string, icon: string) { const name = prompt('修改账本名称', current); if (!name) return; try { await updateLedger(id, name, icon) } catch (reason) { error.value = reason instanceof Error ? reason.message : '修改账本失败' } }
async function removeLedger(id: string, name: string) { if (!confirm(`删除“${name}”及其中全部账目和图片？此操作无法撤销。`)) return; try { await deleteLedger(id) } catch (reason) { error.value = reason instanceof Error ? reason.message : '删除账本失败' } }
async function downloadBackup() {
  busy.value = true; error.value = ''
  try {
    const blob = await exportBackup(db); const url = URL.createObjectURL(blob); const link = document.createElement('a')
    link.href = url; link.download = `钱迹备份-${new Date().toISOString().slice(0, 10)}.zip`; link.click(); URL.revokeObjectURL(url)
    message.value = `备份已生成：${formatDateTime(new Date())}`
  } catch (reason) { error.value = reason instanceof Error ? reason.message : '导出失败' } finally { busy.value = false }
}
async function restore(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return
  busy.value = true; error.value = ''
  try { const result = await importBackup(file, db); message.value = `已恢复 ${result.imported} 笔、${result.images} 张图片，跳过 ${result.skipped} 笔` }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '导入失败，现有数据未改变' }
  finally { busy.value = false; (event.target as HTMLInputElement).value = '' }
}
async function clearAll() {
  if (!window.confirm('确定清空全部账目和图片吗？此操作无法撤销。')) return
  await db.transaction('rw', db.records, db.images, db.categories, async () => { await Promise.all([db.records.clear(), db.images.clear(), db.categories.clear()]) })
  message.value = '本地数据已清空'
}
</script>
<template>
  <main class="page settings-page"><header><h1>设置</h1><small>管理应用与本地数据</small></header>
    <h2>多账本</h2><section class="ledger-list"><div v-for="ledger in ledgerItems" :key="ledger.id" :class="{active:activeLedgerId===ledger.id}"><button class="ledger-main" type="button" @click="setActiveLedger(ledger.id)"><i>{{ ledger.icon }}</i><span><b>{{ ledger.name }}</b><small>{{ activeLedgerId===ledger.id ? '当前账本 · 收支独立统计' : '切换到此账本' }}</small></span><em>{{ activeLedgerId===ledger.id ? '✓' : '›' }}</em></button><button type="button" aria-label="修改账本" @click="renameLedger(ledger.id,ledger.name,ledger.icon)">修改</button><button class="remove-ledger" type="button" aria-label="删除账本" @click="removeLedger(ledger.id,ledger.name)">删除</button></div><button class="add-ledger" type="button" @click="createLedger">＋ 新增账本</button></section>
    <h2>主题风格</h2><section class="theme-picker" aria-label="主题风格"><button v-for="theme in appThemes" :key="theme.id" type="button" :aria-pressed="selectedTheme === theme.id" @click="selectTheme(theme.id)"><span class="theme-swatches"><i v-for="color in theme.colors" :key="color" :style="{ background: color }" /></span><b>{{ theme.name }}</b><small>{{ theme.description }}</small><em>✓</em></button></section>
    <section class="setting-list"><div><i class="green">⌂</i><span><b>安装到桌面</b><small>添加到主屏幕，像 App 一样使用</small></span><em>›</em></div><div><i class="blue">▣</i><span><b>本地存储</b><small>账目与图片仅保存在当前设备</small></span><em>›</em></div></section>
    <h2>备份与恢复</h2><section class="setting-list actions"><button :disabled="busy" @click="downloadBackup"><i class="orange">⇧</i><span><b>导出 ZIP 备份</b><small>保存全部账目和图片</small></span><em>›</em></button><label><i class="purple">⇩</i><span><b>导入 ZIP 备份</b><small>从已有备份恢复数据</small></span><em>›</em><input type="file" accept=".zip,application/zip" @change="restore" /></label></section>
    <h2>数据管理</h2><section class="setting-list"><button class="danger" @click="clearAll"><i>⌫</i><span><b>清空全部数据</b><small>此操作无法撤销</small></span><em>›</em></button></section>
    <p v-if="message" class="success" role="status">{{ message }}</p><p v-if="error" class="error" role="alert">{{ error }}</p>
  </main>
</template>
<style scoped>
.settings-page { display:grid;gap:14px }.settings-page h1,.settings-page h2 { margin:0 }.settings-page header h1{font-size:22px}.settings-page header small{color:var(--muted);font-size:11px}.settings-page h2{margin-top:6px;font-size:13px}.setting-list{overflow:hidden;border:1px solid var(--border);border-radius:18px;background:var(--surface);box-shadow:0 7px 24px rgba(87,57,39,.05)}.setting-list>div,.setting-list button,.setting-list label{position:relative;width:100%;min-height:64px;padding:10px 13px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:10px;border:0;border-bottom:1px solid var(--border);background:transparent;text-align:left}.setting-list>*:last-child{border-bottom:0!important}.setting-list i{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:#edf6ea;color:var(--income);font-style:normal}.setting-list .blue{background:#edf4f9;color:var(--blue)}.setting-list .orange{background:#fff3e4;color:var(--accent)}.setting-list .purple{background:#f1edf8;color:var(--lavender)}.setting-list span{display:grid;gap:3px}.setting-list b{font-size:13px}.setting-list small{font-size:10px;color:var(--muted)}.setting-list em{font-style:normal;color:#c9beb8}.setting-list input{position:absolute;opacity:0;inset:0;width:100%;height:100%;cursor:pointer}.setting-list .danger{color:var(--expense)}.setting-list .danger i{background:#fff0ed;color:var(--expense)}.success{color:#16815a;font-size:12px}.error{color:var(--expense);font-size:12px}
.theme-picker{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:hidden}.theme-picker button{position:relative;width:100%;min-width:0;max-width:100%;padding:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px;overflow:hidden;border:1px solid var(--border);border-radius:16px;background:var(--surface);text-align:left;box-shadow:0 5px 16px rgba(var(--shadow),.05)}.theme-picker button[aria-pressed=true]{border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-soft)}.theme-swatches{grid-column:1/-1;display:flex;min-width:0;margin-bottom:4px}.theme-swatches i{width:25px;height:25px;flex:0 0 25px;margin-right:-5px;border:2px solid var(--surface);border-radius:50%}.theme-picker b{min-width:0;overflow:hidden;font-size:12px;white-space:nowrap;text-overflow:ellipsis}.theme-picker small{grid-column:1/-1;min-width:0;overflow:hidden;color:var(--muted);font-size:9px;white-space:nowrap;text-overflow:ellipsis}.theme-picker em{grid-column:2;grid-row:2;width:19px;height:19px;display:grid;place-items:center;border-radius:50%;background:var(--primary);color:white;font-size:10px;font-style:normal;opacity:0}.theme-picker button[aria-pressed=true] em{opacity:1}
.ledger-list{overflow:hidden;border:1px solid var(--border);border-radius:18px;background:var(--surface)}.ledger-list>div{display:grid;grid-template-columns:1fr auto auto;align-items:center;border-bottom:1px solid var(--border)}.ledger-list>div.active{background:var(--primary-soft)}.ledger-list button{border:0;background:transparent}.ledger-main{min-height:64px;padding:9px 12px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:9px;text-align:left}.ledger-main i{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:var(--surface);font-style:normal}.ledger-main span{display:grid;gap:2px}.ledger-main small{color:var(--muted);font-size:9px}.ledger-main em{color:var(--primary);font-style:normal}.ledger-list>div>button:not(.ledger-main){padding:6px;color:var(--muted);font-size:10px}.ledger-list>div>.remove-ledger{padding-right:12px;color:var(--expense)}.add-ledger{width:100%;min-height:48px;color:var(--primary);font-size:12px;font-weight:700}
</style>
