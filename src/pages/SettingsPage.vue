<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { db } from '../shared/db/database'
import { exportBackup, importBackup } from '../features/backup/backupService'
import { billingCycleRange, formatDateTime } from '../shared/format/date'
import { appThemes, applyTheme, getThemeId, type ThemeId } from '../features/theme/themeStore'
import { activeLedgerId, addLedger, clearLedgerCycleEndDate, clearLedgerCycleStartDate, deleteLedger, ledgerItems, loadLedgers, setActiveLedger, setLedgerCycleEndDate, setLedgerCycleStartDate, updateLedger } from '../features/ledgers/ledgerStore'
import { formatBytes, getStorageProtectionStatus, requestStorageProtection, type StorageProtectionStatus } from '../features/storage/storageProtection'
import EmojiPickerField from '../shared/components/EmojiPickerField.vue'
import AppLockSetupSheet from '../features/appLock/AppLockSetupSheet.vue'
import { getAppLockType } from '../features/appLock/appLockStore'
import ReleaseNotesSheet from '../features/releaseNotes/ReleaseNotesSheet.vue'

const message = ref(''); const error = ref(''); const busy = ref(false)
const selectedTheme = ref<ThemeId>(getThemeId())
const storageStatus = ref<StorageProtectionStatus>({ supported: false, persisted: false, usage: null, quota: null })
const storageBusy = ref(false)
const storageFeedback = ref('')
const storagePercent = computed(() => storageStatus.value.quota && storageStatus.value.usage !== null
  ? Math.min(100, Math.max(0, storageStatus.value.usage / storageStatus.value.quota * 100))
  : 0)
const storagePercentLabel = computed(() => storagePercent.value > 0 && storagePercent.value < 0.1
  ? '<0.1%'
  : `${Number(storagePercent.value.toFixed(1))}%`)
const storageBarWidth = computed(() => storagePercent.value > 0 ? Math.max(1.5, storagePercent.value) : 0)
const ledgerEditor = ref<{ id?: string; name: string; icon: string } | null>(null)
const showAppLock = ref(false)
const showReleaseNotes = ref(false)
const appLockType = ref(getAppLockType())
const cycleMonths = ref<Record<string, string>>({})
const editingCycleLedgerId = ref<string | null>(null)
const editingCycleLedger = computed(() => ledgerItems.value.find((item) => item.id === editingCycleLedgerId.value))
const currentMonth = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 7)
function selectedCycleMonth(id: string) { return cycleMonths.value[id] || currentMonth }
function setSelectedCycleMonth(id: string, month: string) { cycleMonths.value = { ...cycleMonths.value, [id]: month } }
function monthLastDate(month: string) { const [year, value] = month.split('-').map(Number); return `${month}-${new Date(year, value, 0).getDate()}` }
function defaultCycleDate(month: string, anchor: string) { return `${month}-${String(Math.min(Number(anchor.slice(8, 10)) || 1, Number(monthLastDate(month).slice(8, 10)))).padStart(2, '0')}` }
function cycleStart(ledger: typeof ledgerItems.value[number]) { const month = selectedCycleMonth(ledger.id); return ledger.cycleStartDates?.[month] || defaultCycleDate(month, ledger.cycleAnchorDate) }
function cycleEnd(ledger: typeof ledgerItems.value[number]) { const month = selectedCycleMonth(ledger.id); return ledger.cycleEndDates?.[month] || billingCycleRange(`${month}-31`, ledger.cycleAnchorDate, ledger.cycleStartDates).endInclusive }
let previousBodyOverflow = ''
watch(editingCycleLedgerId, (id) => {
  if (id) { previousBodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden' }
  else document.body.style.overflow = previousBodyOverflow
})
onBeforeUnmount(() => { document.body.style.overflow = previousBodyOverflow })
const refreshAppLockType = () => { appLockType.value = getAppLockType() }
function selectTheme(id: ThemeId) { selectedTheme.value = id; applyTheme(id) }
async function refreshStorageProtection(requestIfNeeded = false, announce = false) {
  storageBusy.value = true
  try {
    const current = await getStorageProtectionStatus()
    storageStatus.value = requestIfNeeded && current.supported && !current.persisted
      ? await requestStorageProtection()
      : current
    if (announce) storageFeedback.value = storageStatus.value.persisted
      ? '存储保护已开启'
      : storageStatus.value.error || '浏览器暂未批准，请继续定期导出备份'
  } finally {
    storageBusy.value = false
  }
}
onMounted(() => { void loadLedgers(); void refreshStorageProtection(true) })
function createLedger() { ledgerEditor.value = { name: '', icon: '📒' } }
function renameLedger(id: string, current: string, icon: string) { ledgerEditor.value = { id, name: current, icon } }
async function saveLedger() {
  if (!ledgerEditor.value?.name.trim()) { error.value = '请输入账本名称'; return }
  error.value = ''
  try {
    const draft = ledgerEditor.value
    if (draft.id) await updateLedger(draft.id, draft.name, draft.icon)
    else await addLedger(draft.name, draft.icon)
    ledgerEditor.value = null
  } catch (reason) { error.value = reason instanceof Error ? reason.message : '保存账本失败' }
}
async function changeCycleAnchorDate(id: string, name: string, icon: string, value: string) { try { await updateLedger(id, name, icon, value); message.value = `“${name}”账期锚点已设为${value}` } catch (reason) { error.value = reason instanceof Error ? reason.message : '修改账期失败' } }
async function changeMonthlyCycle(id: string, name: string, month: string, value: string) { try { await setLedgerCycleStartDate(id, month, value); message.value = `“${name}”${month}月起始日已设为${value}` } catch (reason) { error.value = reason instanceof Error ? reason.message : '修改当月起始日失败' } }
async function changeMonthlyCycleEnd(id: string, name: string, month: string, value: string) { try { await setLedgerCycleEndDate(id, month, value); message.value = `“${name}”${month}月终止日已设为${value}` } catch (reason) { error.value = reason instanceof Error ? reason.message : '修改当月终止日失败' } }
async function resetMonthlyCycle(id: string, name: string, month: string) { try { await clearLedgerCycleStartDate(id, month); await clearLedgerCycleEndDate(id, month); message.value = `“${name}”${month}月账期已恢复默认` } catch (reason) { error.value = reason instanceof Error ? reason.message : '恢复默认失败' } }
async function removeLedger(id: string, name: string) { if (!confirm(`删除“${name}”及其中全部账目和图片？此操作无法撤销。`)) return; try { await deleteLedger(id) } catch (reason) { error.value = reason instanceof Error ? reason.message : '删除账本失败' } }
async function downloadBackup() {
  busy.value = true; error.value = ''
  try {
    const blob = await exportBackup(db); const url = URL.createObjectURL(blob); const link = document.createElement('a')
    link.href = url; link.download = `记账备份-${new Date().toISOString().slice(0, 10)}.zip`; link.click(); URL.revokeObjectURL(url)
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
    <h2>多账本</h2><section class="ledger-list"><div v-for="ledger in ledgerItems" :key="ledger.id" :class="{active:activeLedgerId===ledger.id}"><button class="ledger-main" type="button" @click="setActiveLedger(ledger.id)"><i>{{ ledger.icon }}</i><span><b>{{ ledger.name }}</b><small>{{ activeLedgerId===ledger.id ? '当前账本' : '切换到账本' }} · 默认每月{{ Number(ledger.cycleAnchorDate.slice(8,10)) }}日起算</small></span><em>{{ activeLedgerId===ledger.id ? '✓' : '›' }}</em></button><div class="ledger-actions"><button type="button" @click="editingCycleLedgerId=ledger.id">账期设置</button><button type="button" aria-label="修改账本" @click="renameLedger(ledger.id,ledger.name,ledger.icon)">修改</button><button class="remove-ledger" type="button" aria-label="删除账本" @click="removeLedger(ledger.id,ledger.name)">删除</button></div></div><button class="add-ledger" type="button" @click="createLedger">＋ 新增账本</button></section>
    <div v-if="editingCycleLedger" class="cycle-sheet-overlay" @click.self="editingCycleLedgerId=null"><section class="cycle-sheet" role="dialog" aria-modal="true" :aria-label="`${editingCycleLedger.name}账期设置`"><header><div><strong>{{ editingCycleLedger.icon }} {{ editingCycleLedger.name }}</strong><small>账期设置</small></div><button type="button" aria-label="关闭账期设置" @click="editingCycleLedgerId=null">×</button></header><label class="cycle-field"><span>默认起始日<small>每月 {{ Number(editingCycleLedger.cycleAnchorDate.slice(8,10)) }} 日</small></span><input type="date" :value="editingCycleLedger.cycleAnchorDate" :aria-label="`${editingCycleLedger.name}默认账期起始日期`" @change="changeCycleAnchorDate(editingCycleLedger.id,editingCycleLedger.name,editingCycleLedger.icon,($event.target as HTMLInputElement).value)" /></label><div class="monthly-cycle"><label class="cycle-field month-field"><span>单独设置月份<small>选择需要自定义的账期</small></span><input type="month" :value="selectedCycleMonth(editingCycleLedger.id)" :aria-label="`${editingCycleLedger.name}选择账期月份`" @change="setSelectedCycleMonth(editingCycleLedger.id,($event.target as HTMLInputElement).value)" /></label><label class="cycle-field"><span>该期起始日</span><input type="date" :value="cycleStart(editingCycleLedger)" :aria-label="`${editingCycleLedger.name}${selectedCycleMonth(editingCycleLedger.id)}起始日期`" @change="changeMonthlyCycle(editingCycleLedger.id,editingCycleLedger.name,selectedCycleMonth(editingCycleLedger.id),($event.target as HTMLInputElement).value)" /></label><label class="cycle-field"><span>该期终止日<small>包含当天</small></span><input type="date" :min="cycleStart(editingCycleLedger)" :value="cycleEnd(editingCycleLedger)" :aria-label="`${editingCycleLedger.name}${selectedCycleMonth(editingCycleLedger.id)}终止日期`" @change="changeMonthlyCycleEnd(editingCycleLedger.id,editingCycleLedger.name,selectedCycleMonth(editingCycleLedger.id),($event.target as HTMLInputElement).value)" /></label><div class="cycle-status"><small>{{ editingCycleLedger.cycleStartDates?.[selectedCycleMonth(editingCycleLedger.id)] || editingCycleLedger.cycleEndDates?.[selectedCycleMonth(editingCycleLedger.id)] ? '该月已单独设置' : '当前沿用默认账期' }}</small><button v-if="editingCycleLedger.cycleStartDates?.[selectedCycleMonth(editingCycleLedger.id)] || editingCycleLedger.cycleEndDates?.[selectedCycleMonth(editingCycleLedger.id)]" type="button" @click="resetMonthlyCycle(editingCycleLedger.id,editingCycleLedger.name,selectedCycleMonth(editingCycleLedger.id))">恢复默认</button></div></div></section></div>
    <div v-if="ledgerEditor" class="ledger-dialog-overlay" @click.self="ledgerEditor = null"><section class="ledger-dialog" role="dialog" aria-modal="true" :aria-label="ledgerEditor.id ? '修改账本' : '新增账本'"><header><strong>{{ ledgerEditor.id ? '修改账本' : '新增账本' }}</strong><button type="button" aria-label="关闭账本编辑" @click="ledgerEditor = null">×</button></header><input v-model="ledgerEditor.name" maxlength="12" aria-label="账本名称" placeholder="账本名称" /><EmojiPickerField v-model="ledgerEditor.icon" label="账本图标" /><button class="ledger-save" type="button" aria-label="保存账本" @click="saveLedger">保存</button></section></div>
    <h2>主题风格</h2><section class="theme-picker" aria-label="主题风格"><button v-for="theme in appThemes" :key="theme.id" type="button" :aria-pressed="selectedTheme === theme.id" @click="selectTheme(theme.id)"><span class="theme-swatches"><i v-for="color in theme.colors" :key="color" :style="{ background: color }" /></span><b>{{ theme.name }}</b><small>{{ theme.description }}</small><em>✓</em></button></section>
    <h2>隐私与关于</h2><section class="setting-list"><button type="button" aria-label="应用锁设置" @click="showAppLock = true"><i class="purple">⌾</i><span><b>应用锁 · {{ appLockType ? '已开启' : '未开启' }}</b><small>{{ appLockType === 'pin' ? '6位数字密码' : appLockType === 'pattern' ? '九宫格手势' : '保护本地账目隐私' }}</small></span><em>›</em></button><button type="button" aria-label="查看版本公告" @click="showReleaseNotes = true"><i class="blue">i</i><span><b>版本公告</b><small>查看每次发布的更新内容</small></span><em>›</em></button></section>
    <AppLockSetupSheet v-if="showAppLock" @close="showAppLock = false" @saved="refreshAppLockType" />
    <ReleaseNotesSheet v-if="showReleaseNotes" @close="showReleaseNotes = false" />
    <h2>本地存储</h2><section class="setting-list storage-protection"><div><i class="blue">▣</i><span><b>存储保护 · {{ storageStatus.supported ? (storageStatus.persisted ? '已保护' : '未保护') : '不支持' }}</b><small>已用 {{ formatBytes(storageStatus.usage) }} / 配额 {{ formatBytes(storageStatus.quota) }}</small><span class="storage-meter" role="progressbar" aria-label="本地存储使用率" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Number(storagePercent.toFixed(2))"><i :style="{ width: `${storageBarWidth}%` }" /><small>{{ storagePercentLabel }}</small></span><small v-if="storageStatus.error">{{ storageStatus.error }}</small><small v-else>保护可降低空间紧张时被自动清理的风险，但不能替代备份</small></span><em v-if="storageStatus.persisted">✓</em></div><button v-if="storageStatus.supported && !storageStatus.persisted" type="button" aria-label="重新申请存储保护" :disabled="storageBusy" @click="refreshStorageProtection(true, true)"><i class="purple">↻</i><span><b>{{ storageBusy ? '正在申请…' : '重新申请保护' }}</b><small>{{ storageFeedback || '是否批准由当前浏览器决定' }}</small></span><em>›</em></button></section>
    <h2>备份与恢复</h2><section class="setting-list actions"><button :disabled="busy" @click="downloadBackup"><i class="orange">⇧</i><span><b>导出 ZIP 备份</b><small>保存全部账目和图片</small></span><em>›</em></button><label><i class="purple">⇩</i><span><b>导入 ZIP 备份</b><small>从已有备份恢复数据</small></span><em>›</em><input type="file" accept=".zip,application/zip" @change="restore" /></label></section>
    <h2>数据管理</h2><section class="setting-list"><button class="danger" @click="clearAll"><i>⌫</i><span><b>清空全部数据</b><small>此操作无法撤销</small></span><em>›</em></button></section>
    <p v-if="message" class="success" role="status">{{ message }}</p><p v-if="error" class="error" role="alert">{{ error }}</p>
  </main>
</template>
<style scoped>
.settings-page { display:grid;gap:14px }.settings-page h1,.settings-page h2 { margin:0 }.settings-page header h1{font-size:22px}.settings-page header small{color:var(--muted);font-size:11px}.settings-page h2{margin-top:6px;font-size:13px}.setting-list{overflow:hidden;border:1px solid var(--border);border-radius:18px;background:var(--surface);box-shadow:0 7px 24px rgba(87,57,39,.05)}.setting-list>div,.setting-list button,.setting-list label{position:relative;width:100%;min-height:64px;padding:10px 13px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:10px;border:0;border-bottom:1px solid var(--border);background:transparent;text-align:left}.setting-list>*:last-child{border-bottom:0!important}.setting-list i{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:#edf6ea;color:var(--income);font-style:normal}.setting-list .blue{background:#edf4f9;color:var(--blue)}.setting-list .orange{background:#fff3e4;color:var(--accent)}.setting-list .purple{background:#f1edf8;color:var(--lavender)}.setting-list span{display:grid;gap:3px}.setting-list b{font-size:13px}.setting-list small{font-size:10px;color:var(--muted)}.setting-list em{font-style:normal;color:#c9beb8}.setting-list input{position:absolute;opacity:0;inset:0;width:100%;height:100%;cursor:pointer}.setting-list .danger{color:var(--expense)}.setting-list .danger i{background:#fff0ed;color:var(--expense)}.success{color:#16815a;font-size:12px}.error{color:var(--expense);font-size:12px}
.theme-picker{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:hidden}.theme-picker button{position:relative;width:100%;min-width:0;max-width:100%;padding:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px;overflow:hidden;border:1px solid var(--border);border-radius:16px;background:var(--surface);text-align:left;box-shadow:0 5px 16px rgba(var(--shadow),.05)}.theme-picker button[aria-pressed=true]{border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-soft)}.theme-swatches{grid-column:1/-1;display:flex;min-width:0;margin-bottom:4px}.theme-swatches i{width:25px;height:25px;flex:0 0 25px;margin-right:-5px;border:2px solid var(--surface);border-radius:50%}.theme-picker b{min-width:0;overflow:hidden;font-size:12px;white-space:nowrap;text-overflow:ellipsis}.theme-picker small{grid-column:1/-1;min-width:0;overflow:hidden;color:var(--muted);font-size:9px;white-space:nowrap;text-overflow:ellipsis}.theme-picker em{grid-column:2;grid-row:2;width:19px;height:19px;display:grid;place-items:center;border-radius:50%;background:var(--primary);color:white;font-size:10px;font-style:normal;opacity:0}.theme-picker button[aria-pressed=true] em{opacity:1}
.ledger-list{overflow:hidden;border:1px solid var(--border);border-radius:18px;background:var(--surface)}.ledger-list>div{display:grid;grid-template-columns:1fr auto auto;align-items:center;border-bottom:1px solid var(--border)}.ledger-list>div.active{background:var(--primary-soft)}.ledger-list button{border:0;background:transparent}.ledger-main{grid-column:1/-1;min-height:64px;padding:9px 12px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:9px;text-align:left}.ledger-main i{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:var(--surface);font-style:normal}.ledger-main span{display:grid;gap:2px}.ledger-main small{color:var(--muted);font-size:9px}.ledger-main em{color:var(--primary);font-style:normal}.cycle-start{padding:7px 12px;display:flex;align-items:center;gap:6px;color:var(--muted);font-size:10px}.cycle-start input{padding:5px 7px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--ink);font-size:10px}.ledger-list>div>button:not(.ledger-main){padding:6px;color:var(--muted);font-size:10px}.ledger-list>div>.remove-ledger{padding-right:12px;color:var(--expense)}.add-ledger{width:100%;min-height:48px;color:var(--primary);font-size:12px;font-weight:700}
.ledger-dialog-overlay{position:fixed;z-index:110;inset:0;display:flex;align-items:flex-end;background:rgba(48,42,39,.45);backdrop-filter:blur(2px)}.ledger-dialog{width:min(100%,430px);margin:0 auto;padding:18px 18px calc(20px + var(--safe-bottom));display:grid;gap:12px;border-radius:28px 28px 0 0;background:var(--surface);box-shadow:0 -16px 45px rgba(42,31,25,.2)}.ledger-dialog header{display:flex;align-items:center;justify-content:space-between}.ledger-dialog header strong{font-size:17px}.ledger-dialog header button{width:34px;height:34px;border:0;border-radius:50%;background:var(--surface-soft);color:var(--muted);font-size:21px}.ledger-dialog>input{min-height:44px;padding:0 12px;border:1px solid var(--border);border-radius:12px;background:var(--surface-soft);color:var(--text)}.ledger-save{min-height:44px;border:0;border-radius:12px;background:var(--primary);color:white;font-weight:700}
.storage-meter{position:relative!important;height:9px!important;margin:3px 38px 2px 0!important;display:block!important;overflow:visible!important;border-radius:999px;background:var(--primary-soft)}.storage-meter>i{height:100%;min-width:0;border-radius:inherit;background:linear-gradient(90deg,var(--primary),color-mix(in srgb,var(--primary) 65%,white));box-shadow:0 0 7px color-mix(in srgb,var(--primary) 25%,transparent)}.storage-meter>small{position:absolute;left:calc(100% + 6px);top:50%;transform:translateY(-50%);color:var(--primary);font-size:9px;font-weight:700;white-space:nowrap}
.default-cycle{grid-column:1/-1;justify-content:space-between}.monthly-cycle{grid-column:1/-1;margin:0 10px;padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px;border-radius:12px;background:var(--surface-soft)}.monthly-cycle label{display:grid;gap:4px;color:var(--muted);font-size:9px}.monthly-cycle input{width:100%;min-width:0;padding:7px 5px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--ink);font-size:10px}.monthly-cycle button,.monthly-cycle>small{grid-column:1/-1;justify-self:end;padding:0!important;color:var(--primary)!important;font-size:9px!important}
.cycle-settings{grid-column:1/-1;margin:0 10px 8px;padding:10px;display:grid;gap:10px;border-radius:14px;background:color-mix(in srgb,var(--surface) 55%,var(--primary-soft))}.cycle-field{min-width:0;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(145px,48%);align-items:center;gap:12px;color:var(--muted);font-size:10px}.cycle-field>span{display:grid;gap:2px}.cycle-field small{color:var(--muted);font-size:8px}.cycle-field input{width:100%;min-width:0;min-height:38px;padding:7px 9px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--ink);font-size:11px}.cycle-settings .monthly-cycle{margin:0;padding:10px;display:grid;grid-template-columns:1fr;gap:10px;border:1px solid color-mix(in srgb,var(--primary) 12%,var(--border));border-radius:12px;background:var(--surface-soft)}.cycle-settings .monthly-cycle label{display:grid!important}.cycle-settings .month-field{padding-bottom:9px;border-bottom:1px solid var(--border)}.cycle-status{display:flex;align-items:center;justify-content:space-between}.cycle-status small{color:var(--muted);font-size:9px}.cycle-status button{padding:5px 8px!important;border-radius:8px!important;background:var(--primary-soft)!important;color:var(--primary)!important;font-size:9px!important}@media(max-width:360px){.cycle-field{grid-template-columns:1fr}.cycle-field input{min-height:42px}}
.ledger-actions{grid-column:1/-1;padding:0 10px 9px;display:grid;grid-template-columns:1fr auto auto;gap:6px}.ledger-actions button{min-height:34px;padding:6px 10px!important;border-radius:10px!important;background:var(--surface)!important;color:var(--muted)!important;font-size:10px!important}.ledger-actions button:first-child{color:var(--primary)!important;font-weight:700}.ledger-actions .remove-ledger{color:var(--expense)!important}.cycle-sheet-overlay{position:fixed;z-index:125;inset:0;display:flex;align-items:flex-end;overscroll-behavior:none;background:rgba(48,42,39,.46);backdrop-filter:blur(3px)}.cycle-sheet{width:min(100%,430px);max-height:82dvh;margin:0 auto;padding:16px 16px calc(18px + var(--safe-bottom));display:grid;gap:13px;overflow:auto;overscroll-behavior:contain;border-radius:28px 28px 0 0;background:var(--surface);box-shadow:0 -16px 45px rgba(42,31,25,.2)}.cycle-sheet>header{display:flex;align-items:center;justify-content:space-between}.cycle-sheet>header>div{display:grid;gap:2px}.cycle-sheet>header strong{font-size:16px}.cycle-sheet>header small{color:var(--muted);font-size:9px}.cycle-sheet>header button{width:34px;height:34px;border:0;border-radius:50%;background:var(--surface-soft);color:var(--muted);font-size:21px}.cycle-sheet>.cycle-field{padding:11px;border:1px solid var(--border);border-radius:13px;background:var(--surface-soft)}.cycle-sheet .monthly-cycle{margin:0;padding:11px;display:grid;grid-template-columns:1fr;gap:11px;border:1px solid var(--border);border-radius:14px;background:var(--surface-soft)}.cycle-sheet .monthly-cycle label{display:grid!important}.cycle-sheet .month-field{padding-bottom:10px;border-bottom:1px solid var(--border)}
@media(max-width:480px){.cycle-sheet{width:calc(100% - 16px);padding-inline:14px}.cycle-sheet .cycle-field{grid-template-columns:minmax(0,1fr);gap:7px}.cycle-sheet .cycle-field input{inline-size:100%;min-inline-size:0;max-inline-size:100%;min-height:42px;padding-inline:10px;font-size:10px}.cycle-sheet .monthly-cycle{padding:10px}}
</style>
