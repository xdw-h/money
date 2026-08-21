<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { db } from '../shared/db/database'
import { formatMoney } from '../shared/format/money'
import { categoryItems, loadCategories } from '../features/records/categoryStore'
import { categoryRanking, filterPeriod, summarize, summarizeThroughYear, trendSeries, type PeriodMode } from '../features/statistics/aggregate'
import TrendChart from '../features/statistics/TrendChart.vue'
import RecentRecordList from '../features/records/RecentRecordList.vue'
import type { ImageEntity, RecordEntity, RecordType } from '../features/records/types'
import { useRouter } from 'vue-router'
import { activeLedger, activeLedgerId, loadLedgers } from '../features/ledgers/ledgerStore'
import { billingCycleRange } from '../shared/format/date'
import MonthPickerSheet from '../shared/components/MonthPickerSheet.vue'
import { useBodyScrollLock } from '../shared/ui/useBodyScrollLock'
import IconDisplay from '../shared/components/IconDisplay.vue'

const records = ref<RecordEntity[]>([]); const images = ref<ImageEntity[]>([])
const router = useRouter()
const mode = ref<PeriodMode>('month'); const type = ref<RecordType>('expense'); const chartType = ref<'bar'|'line'>('bar')
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const anchor = ref(today); const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const cycleAnchorDate = computed(() => activeLedger.value?.cycleAnchorDate)
const cycleStartDates = computed(() => activeLedger.value?.cycleStartDates)
const cycleEndDates = computed(() => activeLedger.value?.cycleEndDates)
const cycleRange = computed(() => billingCycleRange(anchor.value, cycleAnchorDate.value, cycleStartDates.value, cycleEndDates.value))
const monthValue = computed({ get: () => cycleRange.value.start.slice(0, 7), set: (value: string) => { anchor.value = `${value}-31` } })
const monthPickerOpen = ref(false)
const monthLabel = computed(() => { const [year, month] = monthValue.value.split('-').map(Number); return `${year}年${month}月` })
const yearValue = computed({ get: () => Number(anchor.value.slice(0, 4)), set: (value: number) => { anchor.value = `${value}-01-01` } })
const periodOptions = computed(() => ({ mode: mode.value, anchor: anchor.value, timeZone, cycleAnchorDate: cycleAnchorDate.value, cycleStartDates: cycleStartDates.value, cycleEndDates: cycleEndDates.value }))
const summary = computed(() => summarize(records.value, periodOptions.value))
const cumulativeSummary = computed(() => summarizeThroughYear(records.value, { mode: 'year', anchor: anchor.value, timeZone }))
const trend = computed(() => trendSeries(records.value, { ...periodOptions.value, type: type.value }))
const ranking = computed(() => categoryRanking(records.value, { ...periodOptions.value, type: type.value }))
const filtered = computed(() => filterPeriod(records.value, { ...periodOptions.value, type: type.value }))
const categoryMap = computed(() => new Map(categoryItems.value.map((item) => [item.id, item])))
async function loadData() { records.value = await db.records.where('ledgerId').equals(activeLedgerId.value).reverse().sortBy('occurredAt'); const ids = records.value.map((item) => item.id); images.value = ids.length ? await db.images.where('recordId').anyOf(ids).toArray() : [] }
onMounted(async () => { await Promise.all([loadCategories(), loadLedgers()]); await loadData() })
watch(activeLedgerId, loadData)
useBodyScrollLock(monthPickerOpen)
async function remove(id: string) { if (!confirm('确定删除这笔账目吗？')) return; await db.transaction('rw', db.records, db.images, async () => { await db.images.where('recordId').equals(id).delete(); await db.records.delete(id) }); records.value = records.value.filter((item) => item.id !== id) }
function changeYear(offset: number) { yearValue.value += offset }
function selectMonth(value: string) { if (/^\d{4}-\d{2}$/.test(value)) monthValue.value = value; monthPickerOpen.value = false }
</script>
<template>
  <main class="page bills-page">
    <header class="bills-header"><div><h1>{{ mode === 'month' ? '月账单' : '年账单' }}</h1><small><IconDisplay :icon="activeLedger?.icon ?? '📒'" /> {{ activeLedger?.name }} · 独立统计</small></div></header>
    <div class="segmented"><button :class="{active:mode==='month'}" @click="mode='month'">月账单</button><button :class="{active:mode==='year'}" @click="mode='year'">年账单</button></div>
    <div class="period-input"><button v-if="mode === 'month'" type="button" aria-label="选择月份" @click="monthPickerOpen=true">{{ monthLabel }}</button><div v-else class="year-picker"><button type="button" aria-label="上一年" @click="changeYear(-1)">‹</button><strong>{{ yearValue }} 年</strong><button type="button" aria-label="下一年" @click="changeYear(1)">›</button></div><small v-if="mode === 'month'">本期：{{ cycleRange.start }} 至 {{ cycleRange.endInclusive }}</small></div>
    <div class="segmented type"><button :class="{active:type==='expense'}" @click="type='expense'">支出</button><button :class="{active:type==='income'}" @click="type='income'">收入</button></div>
    <section class="summary-card"><small>{{ mode === 'year' ? '本年结余' : '本期结余' }}</small><strong>{{ formatMoney(summary.balance) }}</strong><div><span class="income">收入 {{ formatMoney(summary.income) }}</span><span class="expense">支出 {{ formatMoney(summary.expense) }}</span></div><p v-if="mode === 'year'" class="cumulative">截至 {{ yearValue }} 年末累计结余 <b>{{ formatMoney(cumulativeSummary.balance) }}</b></p><p>共 {{ filtered.length }} 笔{{ type === 'expense' ? '支出' : '收入' }}记录</p></section>
    <div class="section-title"><h2>{{ type === 'expense' ? '支出' : '收入' }}趋势</h2><div class="chart-toggle"><button @click="chartType='bar'">柱状图</button><button @click="chartType='line'">折线图</button></div></div>
    <section class="chart-card"><TrendChart v-if="trend.values.some(Boolean)" :labels="trend.labels" :values="trend.values" :type="chartType" :color="type === 'income' ? '#679ce8' : '#e7685d'" /><div v-else class="chart-empty">本周期暂无数据</div></section>
    <h2>分类占比</h2><section class="ranking-card"><div v-if="ranking.length" v-for="item in ranking" :key="item.categoryId"><span><IconDisplay :icon="categoryMap.get(item.categoryId)?.icon ?? '✦'" /> {{ categoryMap.get(item.categoryId)?.name }}</span><b>{{ item.percent }}%</b><progress :value="item.percent" max="100" /><strong>{{ formatMoney(item.amount) }}</strong></div><p v-else>暂无分类数据</p></section>
    <h2>账单明细</h2><RecentRecordList :records="filtered" :images="images" @edit="router.push(`/record/${$event}`)" @delete="remove" />
    <MonthPickerSheet v-if="monthPickerOpen" :model-value="monthValue" title="选择账单月份" @close="monthPickerOpen=false" @select="selectMonth" />
  </main>
</template>
<style scoped>
.bills-page { display: grid; gap: 14px; }.bills-page h1,.bills-page h2 { margin: 0; }.bills-page h2{font-size:15px}.bills-header{display:flex;justify-content:space-between;align-items:center}.bills-header h1{font-size:22px}.bills-header small{color:var(--muted);font-size:11px}.segmented { justify-self: center; display: flex; padding: 3px; border-radius: 12px; background: var(--surface-soft); }.segmented button,.chart-toggle button { min-height: 36px; padding: 0 18px; border: 0; border-radius: 10px; background: transparent;font-size:12px }.segmented .active { background: var(--surface);color:var(--primary); box-shadow: 0 2px 8px rgba(var(--shadow),.08); }.segmented.type { justify-self: stretch; }.segmented.type button { flex: 1; }.period-input>button { width: 100%;min-height:42px;padding:10px;border:1px solid var(--border);border-radius:13px;background:var(--surface);text-align:center;color:var(--muted);font:inherit;font-size:12px }
.period-input{display:grid;gap:5px}.period-input small{text-align:center;color:var(--muted);font-size:10px}.summary-card,.chart-card,.ranking-card { padding: 15px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface);box-shadow:0 7px 24px rgba(87,57,39,.05) }.summary-card { display: grid; gap: 8px; }.summary-card>small{color:var(--muted)}.summary-card strong { font-size: 30px; }.summary-card div{display:grid;grid-template-columns:1fr 1fr;gap:8px}.summary-card div span{padding:9px;border-radius:12px;background:var(--surface-soft);font-size:12px}.income { color: var(--income); }.expense { color: var(--expense); }.summary-card p { margin: 0; color: var(--muted); font-size: 11px; }.section-title { display:flex;justify-content:space-between;align-items:center }.chart-toggle { display:flex;background:#eee7e2;border-radius:10px }.chart-toggle button { min-height:30px;padding:0 10px }.chart-empty { height: 180px; display:grid;place-items:center;color:var(--muted) }.ranking-card { display:grid;gap:13px }.ranking-card>div { display:grid;grid-template-columns:1fr auto;gap:5px;font-size:12px }.ranking-card progress { grid-column:1 / -1;width:100%;height:6px;accent-color:var(--expense) }.ranking-card strong { justify-self:end }
.year-picker{display:grid!important;grid-template-columns:42px 1fr 42px!important;align-items:center;gap:8px}.year-picker button{height:40px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--primary);font-size:24px}.year-picker strong{text-align:center;font-size:16px}.summary-card .cumulative{padding:10px 12px;display:flex;justify-content:space-between;border-radius:12px;background:var(--primary-soft);color:var(--text)}.summary-card .cumulative b{color:var(--primary);font-size:12px}
</style>
