<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { db } from '../shared/db/database'
import { formatMoney } from '../shared/format/money'
import { formatDate, formatDateTime } from '../shared/format/date'
import { deleteDeposit, deletePlan, savingsProgress } from '../features/savings/savingsService'
import type { SavingsDeposit, SavingsPlan } from '../features/savings/types'
import SavingsForm from '../features/savings/SavingsForm.vue'
import { useLocalToday } from '../shared/ui/useLocalToday'

const plans = ref<SavingsPlan[]>([])
const deposits = ref<SavingsDeposit[]>([])
const selectedId = ref('')
const selected = computed(() => plans.value.find(plan => plan.id === selectedId.value))
const entries = computed(() => deposits.value.filter(item => item.planId === selectedId.value).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)))
const cards = computed(() => plans.value.map(plan => ({ plan, progress: savingsProgress(plan, deposits.value, today.value) })))
const today = useLocalToday()
const total = computed(() => deposits.value.reduce((sum, item) => sum + item.amount, 0))
const completedCount = computed(() => cards.value.filter(item => item.progress.completed).length)
const form = ref<{ mode: 'plan' | 'deposit'; plan?: SavingsPlan; deposit?: SavingsDeposit } | null>(null)
const loading = ref(true)
const error = ref('')
const message = ref('')
const busy = ref(false)
async function load() {
  try {
    const [p, d] = await Promise.all([db.savingsPlans.orderBy('createdAt').reverse().toArray(), db.savingsDeposits.toArray()])
    plans.value = p; deposits.value = d; today.value = formatDate(new Date()); error.value = ''
  } catch { error.value = '读取存钱计划失败，请重试' }
  finally { loading.value = false }
}
async function saved() { form.value = null; message.value = '已保存，存钱进度已更新'; await load() }
async function removeRecord(entry: SavingsDeposit) {
  if (busy.value || !confirm('确定删除这笔存入记录吗？计划进度将重新计算。')) return
  busy.value = true
  try { await deleteDeposit(db, entry.id); await load(); message.value = '已删除记录，进度已更新' }
  catch { error.value = '删除失败，请重试' }
  finally { busy.value = false }
}
async function removePlan(plan: SavingsPlan) {
  if (busy.value || !confirm(`确定删除“${plan.name}”及其全部存入记录吗？此操作无法撤销。`)) return
  busy.value = true
  try { await deletePlan(db, plan.id); selectedId.value = ''; await load(); message.value = '已删除计划' }
  catch { error.value = '删除失败，请重试' }
  finally { busy.value = false }
}
onMounted(load)
</script>

<template>
  <main class="page savings-page">
    <header class="savings-header"><button v-if="selected" type="button" class="back" @click="selectedId = ''">‹ 计划列表</button><RouterLink v-else to="/" class="back">‹ 首页</RouterLink><span>一点一点，靠近心愿</span></header>
    <template v-if="!selected">
      <div class="page-title"><div><small>为喜欢的生活留一笔</small><h1>存钱计划<span>✦</span></h1></div><button data-action="create-plan" class="primary small" @click="form = { mode: 'plan' }">＋ 新建计划</button></div>
      <section class="savings-summary"><div class="jar" aria-hidden="true">🪴</div><small>我的心愿储蓄</small><strong>{{ formatMoney(total) }}</strong><div><span>{{ plans.length }} 个计划</span><span>{{ completedCount }} 个已达成</span></div><p>每一次存入，都是未来生活的一小步。</p></section>
    </template>
    <p v-if="loading" class="feedback" role="status">正在读取计划…</p>
    <p v-if="error" role="alert" class="error">{{ error }} <button @click="load">重试</button></p>
    <p v-if="message" role="status" class="feedback">{{ message }}</p>
    <section v-if="!loading && !plans.length && !error" class="empty"><span aria-hidden="true">🐷</span><h2>第一个心愿，从这里开始</h2><p>旅行、学习、一份礼物……<br />给期待一个名字，慢慢存成现实。</p><button class="primary" @click="form = { mode: 'plan' }">创建我的第一个计划</button></section>
    <div v-if="!selected && plans.length" class="list-heading"><h2>我的计划</h2><small>按创建时间排列</small></div>
    <template v-for="{ plan, progress } in cards" :key="plan.id">
      <article v-if="!selected || selected.id === plan.id" class="plan-card" :class="{ complete: progress.completed }">
        <header><span class="plan-icon" aria-hidden="true">{{ progress.completed ? '🏆' : plan.deadline ? '⏳' : '🌱' }}</span><div><button class="plan-name" @click="selectedId = plan.id">{{ plan.name }}</button><small>{{ plan.deadline ? `目标日期 ${formatDate(plan.deadline + 'T12:00:00')}` : '无期限 · 按自己的节奏攒' }}</small></div><span class="badge" :class="{ expired: progress.expired }">{{ progress.completed ? '已达成' : progress.expired ? '已到期' : plan.deadline ? '按时攒' : '慢慢攒' }}</span></header>
        <div class="amount-row"><div><small>已存入</small><strong>{{ formatMoney(progress.total) }}</strong></div><span>目标 {{ formatMoney(plan.targetAmount) }}</span></div>
        <div class="progress-caption"><span>{{ progress.completed ? '心愿基金已备好！' : `还差 ${formatMoney(progress.remaining)}` }}</span><b>{{ progress.percent }}%</b></div>
        <div class="progress-track" role="progressbar" :aria-label="`${plan.name}存钱进度`" :aria-valuenow="progress.barPercent" aria-valuemin="0" aria-valuemax="100" :aria-valuetext="`${progress.percent}%`"><i :style="{ width: `${progress.barPercent}%` }" /></div>
        <div v-if="plan.deadline && !progress.completed" class="deadline-info"><template v-if="progress.expired">已到期，尚差 {{ formatMoney(progress.remaining) }}，可以继续存入</template><template v-else>含今天还剩 {{ progress.daysLeft }} 天<span>平均每天还需 {{ formatMoney(progress.dailyAmount) }}</span></template></div>
        <footer><small>默认每次 {{ formatMoney(plan.defaultAmount) }}</small><button v-if="!selected" class="detail-button" @click="selectedId = plan.id">详情 ›</button><button data-action="deposit" class="primary" @click="form = { mode: 'deposit', plan }">＋ 存一笔</button></footer>
      </article>
    </template>
    <template v-if="selected">
      <div class="manage-actions"><button @click="form = { mode: 'plan', plan: selected }">编辑计划</button><button class="error" :disabled="busy" @click="removePlan(selected)">删除计划</button></div>
      <div class="list-heading"><h2>存入记录</h2><small>{{ entries.length }} 笔</small></div>
      <p v-if="!entries.length" class="feedback">还没有存入记录，先为心愿存下第一笔吧。</p>
      <article v-for="entry in entries" :key="entry.id" class="deposit-row"><span class="coin" aria-hidden="true">＋</span><div><b>{{ formatMoney(entry.amount) }}</b><p v-if="entry.note">{{ entry.note }}</p><small>{{ formatDateTime(entry.occurredAt) }}</small><div class="entry-actions"><button @click="form = { mode: 'deposit', plan: selected, deposit: entry }">编辑</button><button :disabled="busy" @click="removeRecord(entry)">删除</button></div></div></article>
    </template>
    <p class="footnote">仅记录存钱进度，不计入日常收支 · 数据保存在本机</p>
    <SavingsForm v-if="form" v-bind="form" @close="form = null" @saved="saved" />
  </main>
</template>

<style scoped>
.savings-page{display:grid;gap:18px}.savings-header,.page-title,.list-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.savings-header{font-size:11px;color:var(--muted)}.back{padding:0;border:0;background:none;color:var(--ink);font-size:13px}.page-title small{font-size:11px;color:var(--muted)}h1{font-size:28px;margin:6px 0 0;letter-spacing:-1px}h1 span{color:var(--accent);font-size:23px;margin-left:9px}.primary{border:0;border-radius:12px;background:var(--primary);color:white;padding:11px 15px;font-weight:650;font-size:12px;white-space:nowrap}.primary.small{padding:11px 12px}.savings-summary{position:relative;overflow:hidden;padding:24px;border:1px solid var(--border);border-radius:24px;background:linear-gradient(120deg,var(--primary-soft),var(--surface));display:grid;gap:9px}.savings-summary>small{color:var(--muted);font-size:12px}.savings-summary>strong{font-size:31px;letter-spacing:-1px;overflow-wrap:anywhere;padding-right:45px}.savings-summary>div:not(.jar){display:flex;gap:10px;font-size:11px}.savings-summary>div>span{background:var(--surface);border-radius:8px;padding:5px 9px}.savings-summary p{font-size:10px;color:var(--muted);margin:7px 0 0}.jar{position:absolute;right:15px;top:24px;font-size:58px;transform:rotate(9deg);opacity:.85}.list-heading h2{font-size:16px;margin:0}.list-heading>small,.feedback,.footnote{color:var(--muted);font-size:11px}.plan-card{padding:18px;border:1px solid var(--border);border-radius:22px;background:var(--surface);box-shadow:0 6px 20px rgba(var(--shadow),.04)}.plan-card>header{display:flex;gap:10px;align-items:center}.plan-icon{width:40px;height:40px;flex:none;display:grid;place-items:center;border-radius:13px;background:var(--surface-soft);font-size:23px}.plan-card header>div{flex:1;min-width:0;display:grid;gap:5px}.plan-name{border:0;padding:0;background:none;color:var(--ink);font-weight:750;font-size:16px;text-align:left;overflow-wrap:anywhere}.plan-card header small{font-size:10px;color:var(--muted)}.badge{flex:none;border-radius:7px;padding:5px 7px;color:var(--primary);background:var(--primary-soft);font-size:10px}.badge.expired{color:var(--expense)}.complete .badge{color:var(--income)}.amount-row{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:22px 0 16px}.amount-row>div{display:grid;gap:5px}.amount-row small,.amount-row>span{font-size:10px;color:var(--muted)}.amount-row strong{font-size:26px;letter-spacing:-.8px;overflow-wrap:anywhere}.progress-caption{display:flex;justify-content:space-between;font-size:11px;gap:10px}.progress-caption>span{color:var(--muted)}.progress-caption>b{color:var(--primary)}.progress-track{height:8px;background:var(--surface-soft);border-radius:10px;overflow:hidden;margin-top:9px}.progress-track>i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--primary))}.complete .progress-track>i{background:var(--income)}.deadline-info{display:flex;flex-wrap:wrap;gap:5px;justify-content:space-between;margin-top:13px;padding:10px;border-radius:10px;background:var(--surface-soft);font-size:10px;color:var(--muted);line-height:1.6}.plan-card footer{display:flex;align-items:center;gap:10px;margin-top:18px}.plan-card footer small{flex:1;font-size:10px;color:var(--muted)}.detail-button{background:none;border:0;color:var(--muted);font-size:11px;padding:8px 0}.manage-actions{display:flex;gap:12px;justify-content:flex-end}.manage-actions button,.entry-actions button{background:var(--surface-soft);border:0;border-radius:8px;font-size:11px;padding:8px 12px}.error{color:var(--expense);font-size:12px}.feedback{line-height:1.7;margin:0}.deposit-row{display:flex;gap:12px;border-bottom:1px solid var(--border);padding:2px 0 15px}.coin{width:35px;height:35px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);border-radius:50%}.deposit-row>div{flex:1;min-width:0}.deposit-row b{font-size:17px;color:var(--income)}.deposit-row p{font-size:12px;overflow-wrap:anywhere;margin:6px 0}.deposit-row small{display:block;color:var(--muted);font-size:10px;margin-top:5px}.entry-actions{display:flex;gap:8px;margin-top:10px}.footnote{text-align:center;font-size:10px;line-height:1.7}.empty{text-align:center;padding:25px 10px}.empty>span{font-size:58px}.empty h2{font-size:17px;margin:18px 0 10px}.empty p{font-size:12px;line-height:1.9;color:var(--muted);margin-bottom:20px}
</style>
