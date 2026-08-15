<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { db } from '../shared/db/database'
import { formatMoney } from '../shared/format/money'
import { categoryItems, loadCategories } from '../features/records/categoryStore'
import { categoryRanking, filterPeriod, summarize, trendSeries, type PeriodMode } from '../features/statistics/aggregate'
import TrendChart from '../features/statistics/TrendChart.vue'
import RecentRecordList from '../features/records/RecentRecordList.vue'
import type { ImageEntity, RecordEntity, RecordType } from '../features/records/types'
import { useRouter } from 'vue-router'

const records = ref<RecordEntity[]>([]); const images = ref<ImageEntity[]>([])
const router = useRouter()
const mode = ref<PeriodMode>('month'); const type = ref<RecordType>('expense'); const chartType = ref<'bar'|'line'>('bar')
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const anchor = ref(today); const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const monthValue = computed({ get: () => anchor.value.slice(0, 7), set: (value: string) => { anchor.value = `${value}-01` } })
const yearValue = computed({ get: () => Number(anchor.value.slice(0, 4)), set: (value: number) => { anchor.value = `${value}-01-01` } })
const summary = computed(() => summarize(records.value, { mode: mode.value, anchor: anchor.value, timeZone }))
const trend = computed(() => trendSeries(records.value, { mode: mode.value, type: type.value, anchor: anchor.value, timeZone }))
const ranking = computed(() => categoryRanking(records.value, { mode: mode.value, type: type.value, anchor: anchor.value, timeZone }))
const filtered = computed(() => filterPeriod(records.value, { mode: mode.value, type: type.value, anchor: anchor.value, timeZone }))
const categoryMap = computed(() => new Map(categoryItems.value.map((item) => [item.id, item])))
onMounted(async () => { await loadCategories(); records.value = await db.records.orderBy('occurredAt').reverse().toArray(); images.value = await db.images.toArray() })
async function remove(id: string) { if (!confirm('确定删除这笔账目吗？')) return; await db.transaction('rw', db.records, db.images, async () => { await db.images.where('recordId').equals(id).delete(); await db.records.delete(id) }); records.value = records.value.filter((item) => item.id !== id) }
</script>
<template>
  <main class="page bills-page">
    <header class="bills-header"><div><h1>{{ mode === 'month' ? '月账单' : '年账单' }}</h1><small>收支趋势与分类统计</small></div><RouterLink to="/settings">•••</RouterLink></header>
    <div class="segmented"><button :class="{active:mode==='month'}" @click="mode='month'">月账单</button><button :class="{active:mode==='year'}" @click="mode='year'">年账单</button></div>
    <div class="period-input"><input v-if="mode === 'month'" v-model="monthValue" type="month" aria-label="选择月份" /><input v-else v-model.number="yearValue" type="number" min="2000" max="2100" aria-label="选择年份" /></div>
    <div class="segmented type"><button :class="{active:type==='expense'}" @click="type='expense'">支出</button><button :class="{active:type==='income'}" @click="type='income'">收入</button></div>
    <section class="summary-card"><small>本期结余</small><strong>{{ formatMoney(summary.balance) }}</strong><div><span class="income">收入 {{ formatMoney(summary.income) }}</span><span class="expense">支出 {{ formatMoney(summary.expense) }}</span></div><p>共 {{ filtered.length }} 笔{{ type === 'expense' ? '支出' : '收入' }}记录</p></section>
    <div class="section-title"><h2>{{ type === 'expense' ? '支出' : '收入' }}趋势</h2><div class="chart-toggle"><button @click="chartType='bar'">柱状图</button><button @click="chartType='line'">折线图</button></div></div>
    <section class="chart-card"><TrendChart v-if="trend.values.some(Boolean)" :labels="trend.labels" :values="trend.values" :type="chartType" :color="type === 'income' ? '#679ce8' : '#e7685d'" /><div v-else class="chart-empty">本周期暂无数据</div></section>
    <h2>分类占比</h2><section class="ranking-card"><div v-if="ranking.length" v-for="item in ranking" :key="item.categoryId"><span>{{ categoryMap.get(item.categoryId)?.icon }} {{ categoryMap.get(item.categoryId)?.name }}</span><b>{{ item.percent }}%</b><progress :value="item.percent" max="100" /><strong>{{ formatMoney(item.amount) }}</strong></div><p v-else>暂无分类数据</p></section>
    <h2>账单明细</h2><RecentRecordList :records="filtered" :images="images" @edit="router.push(`/record/${$event}`)" @delete="remove" />
  </main>
</template>
<style scoped>
.bills-page { display: grid; gap: 14px; }.bills-page h1,.bills-page h2 { margin: 0; }.bills-page h2{font-size:15px}.bills-header{display:flex;justify-content:space-between;align-items:center}.bills-header h1{font-size:22px}.bills-header small{color:var(--muted);font-size:11px}.bills-header a{width:38px;height:38px;display:grid;place-items:center;border:1px solid var(--border);border-radius:50%;background:var(--surface)}.segmented { justify-self: center; display: flex; padding: 3px; border-radius: 12px; background: var(--surface-soft); }.segmented button,.chart-toggle button { min-height: 36px; padding: 0 18px; border: 0; border-radius: 10px; background: transparent;font-size:12px }.segmented .active { background: var(--surface);color:var(--primary); box-shadow: 0 2px 8px rgba(var(--shadow),.08); }.segmented.type { justify-self: stretch; }.segmented.type button { flex: 1; }.period-input input { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 13px; background: var(--surface);text-align:center;color:var(--muted) }
.summary-card,.chart-card,.ranking-card { padding: 15px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface);box-shadow:0 7px 24px rgba(87,57,39,.05) }.summary-card { display: grid; gap: 8px; }.summary-card>small{color:var(--muted)}.summary-card strong { font-size: 30px; }.summary-card div{display:grid;grid-template-columns:1fr 1fr;gap:8px}.summary-card div span{padding:9px;border-radius:12px;background:var(--surface-soft);font-size:12px}.income { color: var(--income); }.expense { color: var(--expense); }.summary-card p { margin: 0; color: var(--muted); font-size: 11px; }.section-title { display:flex;justify-content:space-between;align-items:center }.chart-toggle { display:flex;background:#eee7e2;border-radius:10px }.chart-toggle button { min-height:30px;padding:0 10px }.chart-empty { height: 180px; display:grid;place-items:center;color:var(--muted) }.ranking-card { display:grid;gap:13px }.ranking-card>div { display:grid;grid-template-columns:1fr auto;gap:5px;font-size:12px }.ranking-card progress { grid-column:1 / -1;width:100%;height:6px;accent-color:var(--expense) }.ranking-card strong { justify-self:end }
</style>
