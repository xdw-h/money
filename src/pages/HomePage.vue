<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { db } from '../shared/db/database'
import { formatMoney } from '../shared/format/money'
import { summarize } from '../features/statistics/aggregate'
import RecentRecordList from '../features/records/RecentRecordList.vue'
import type { ImageEntity, RecordEntity } from '../features/records/types'
import { useRouter } from 'vue-router'

const records = ref<RecordEntity[]>([]); const images = ref<ImageEntity[]>([])
const router = useRouter()
const anchor = new Date().toISOString().slice(0, 10)
const summary = computed(() => summarize(records.value, { mode: 'month', anchor }))
type SummaryView = 'balance' | 'expense' | 'income'
type RecentRange = '3' | '7' | 'month'
const summaryView = ref<SummaryView>('balance')
const recentRange = ref<RecentRange>('3')
const recentSort = ref<'time' | 'amount'>('time')
const amountsVisible = ref(localStorage.getItem('money-amounts-visible') !== 'false')
const summaryViews: { id: SummaryView; label: string }[] = [{ id: 'balance', label: '月结余' }, { id: 'expense', label: '本月支出' }, { id: 'income', label: '本月收入' }]
const mainAmount = computed(() => summary.value[summaryView.value])
const secondarySummary = computed(() => summaryViews.filter((item) => item.id !== summaryView.value))
const visibleMoney = (value: number) => amountsVisible.value ? formatMoney(value) : '¥••••'
function toggleAmounts() { amountsVisible.value = !amountsVisible.value; localStorage.setItem('money-amounts-visible', String(amountsVisible.value)) }
const recentRecords = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  if (recentRange.value === 'month') start.setDate(1)
  else start.setDate(start.getDate() - Number(recentRange.value) + 1)
  return records.value.filter((record) => new Date(record.occurredAt) >= start)
    .sort((a, b) => recentSort.value === 'amount' ? b.amount - a.amount : +new Date(b.occurredAt) - +new Date(a.occurredAt))
})
onMounted(async () => { records.value = await db.records.orderBy('occurredAt').reverse().toArray(); images.value = await db.images.toArray() })
async function remove(id: string) { if (!confirm('确定删除这笔账目吗？')) return; await db.transaction('rw', db.records, db.images, async () => { await db.images.where('recordId').equals(id).delete(); await db.records.delete(id) }); records.value = records.value.filter((item) => item.id !== id) }
</script>
<template>
  <main class="page home-page">
    <header class="page-header"><div><h1>{{ new Date().getFullYear() }}年{{ new Date().getMonth() + 1 }}月⌄</h1><small>把每一笔都认真记下 ✦</small></div><RouterLink to="/settings" aria-label="设置">◉</RouterLink></header>
    <section class="balance-card">
      <div class="summary-tabs"><button v-for="item in summaryViews" :key="item.id" type="button" :aria-pressed="summaryView === item.id" @click="summaryView = item.id">{{ item.label }}</button></div>
      <div class="balance-label"><span>{{ summaryViews.find(item => item.id === summaryView)?.label }}</span><button type="button" :aria-label="amountsVisible ? '隐藏金额' : '显示金额'" @click="toggleAmounts">{{ amountsVisible ? '◉' : '◎' }}</button></div>
      <strong :class="summaryView">{{ visibleMoney(mainAmount) }}</strong>
      <div class="balance-split"><span v-for="item in secondarySummary" :key="item.id"><i :class="`${item.id}-dot`">{{ item.id === 'expense' ? '↑' : item.id === 'income' ? '↓' : '↔' }}</i><small>{{ item.label }}</small><b :class="item.id">{{ visibleMoney(summary[item.id]) }}</b></span></div>
      <RouterLink class="card-record-action" to="/record/new">记一笔</RouterLink>
    </section>
    <section class="quick-actions" aria-label="快捷操作"><RouterLink to="/record/new"><i>✎</i><span>记一笔</span></RouterLink><RouterLink to="/bills"><i>▤</i><span>明细</span></RouterLink><RouterLink to="/bills?view=statistics"><i>◔</i><span>统计</span></RouterLink><RouterLink to="/settings"><i>◇</i><span>标签</span></RouterLink></section>
    <div class="section-title"><h2>{{ recentRange === 'month' ? '本月账目' : `近${recentRange}日账目` }}</h2><RouterLink to="/bills">查看账单 →</RouterLink></div>
    <div class="recent-controls"><div><button v-for="item in [{ id: '3', label: '近3天' }, { id: '7', label: '近7天' }, { id: 'month', label: '本月' }]" :key="item.id" type="button" :aria-pressed="recentRange === item.id" @click="recentRange = item.id as RecentRange">{{ item.label }}</button></div><button type="button" @click="recentSort = recentSort === 'time' ? 'amount' : 'time'">{{ recentSort === 'time' ? '按时间' : '按金额' }}⌄</button></div>
    <RecentRecordList :records="recentRecords" :images="images" grouped @edit="router.push(`/record/${$event}`)" @delete="remove" />
  </main>
</template>
<style scoped>
.home-page { display: grid; gap: 16px; }.page-header { display: flex; justify-content: space-between; align-items: center; }.page-header small { color: var(--muted); font-size: 12px; }.page-header h1 { margin: 0 0 4px; font-size: 22px; }.page-header a { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); color: var(--primary); }
.balance-card { padding: 18px; display: grid; gap: 13px; border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface); box-shadow: 0 10px 30px rgba(var(--shadow),.08); }.summary-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:3px;border-radius:12px;background:var(--surface-soft)}.summary-tabs button{min-height:31px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-size:11px}.summary-tabs button[aria-pressed=true]{background:var(--surface);color:var(--ink);font-weight:700;box-shadow:0 2px 8px rgba(var(--shadow),.08)}.balance-label { display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:13px}.balance-label button{width:30px;height:30px;border:0;border-radius:10px;background:var(--primary-soft);color:var(--primary);font-size:16px}.balance-card > strong { font-size: 36px; letter-spacing:-1px; }.balance-card>strong.expense{color:var(--expense)}.balance-card>strong.income{color:var(--income)}.balance-split { display:grid!important;grid-template-columns:1fr 1fr;gap:10px!important }.balance-split>span{display:grid;grid-template-columns:30px 1fr;grid-template-rows:auto auto;column-gap:8px;padding:10px;border-radius:14px;background:var(--surface-soft)}.balance-split i{grid-row:1/3;width:28px;height:28px;display:grid;place-items:center;border-radius:50%;font-style:normal;color:white}.income-dot{background:var(--income)}.expense-dot{background:var(--expense)}.balance-dot{background:var(--accent)}.balance-split small{font-size:11px}.balance-split b{font-size:13px}.balance-split b.expense{color:var(--expense)}.balance-split b.income{color:var(--income)}.card-record-action{min-height:42px;display:grid;place-items:center;border-radius:13px;background:var(--primary);color:#fff;font-size:14px;font-weight:700}
.quick-actions{display:grid;grid-template-columns:repeat(4,1fr);padding:14px 8px;border:1px solid var(--border);border-radius:18px;background:var(--surface);box-shadow:0 8px 24px rgba(87,57,39,.05)}.quick-actions a{display:grid;justify-items:center;gap:7px;font-size:11px;color:var(--muted)}.quick-actions i{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#fff0ed;color:var(--expense);font-style:normal;font-size:18px}.quick-actions a:nth-child(2) i{background:#edf6ea;color:var(--income)}.quick-actions a:nth-child(3) i{background:#f2eef9;color:var(--lavender)}.quick-actions a:nth-child(4) i{background:#fff5e7;color:var(--accent)}.section-title { display: flex; justify-content: space-between; align-items: center; }.section-title h2 { margin: 0; font-size: 16px; }.section-title a { color: var(--muted); font-size: 12px; }
.recent-controls{display:flex;align-items:center;justify-content:space-between;margin-top:-8px}.recent-controls>div{display:flex;gap:4px}.recent-controls button{padding:6px 9px;border:0;border-radius:9px;background:var(--surface-soft);color:var(--muted);font-size:10px}.recent-controls button[aria-pressed=true]{background:var(--primary-soft);color:var(--primary);font-weight:700}
</style>
