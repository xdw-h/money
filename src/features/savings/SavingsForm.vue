<script setup lang="ts">
import { ref } from 'vue'
import { db } from '../../shared/db/database'
import { formatDate } from '../../shared/format/date'
import DatePickerSheet from '../../shared/components/DatePickerSheet.vue'
import { useBodyScrollLock } from '../../shared/ui/useBodyScrollLock'
import { useLocalToday } from '../../shared/ui/useLocalToday'
import { parseSavingsAmount, saveDeposit, savePlan } from './savingsService'
import type { SavingsDeposit, SavingsPlan } from './types'

const props = defineProps<{ mode: 'plan' | 'deposit'; plan?: SavingsPlan; deposit?: SavingsDeposit }>()
const emit = defineEmits<{ close: []; saved: [] }>()
useBodyScrollLock()
const name = ref(props.plan?.name ?? '')
const target = ref(props.plan ? String(props.plan.targetAmount / 100) : '')
const defaultAmount = ref(props.plan ? String(props.plan.defaultAmount / 100) : '')
const limited = ref(Boolean(props.plan?.deadline))
const today = useLocalToday()
const deadline = ref(props.plan?.deadline ?? today.value)
const amount = ref(String((props.deposit?.amount ?? props.plan?.defaultAmount ?? 0) / 100))
const note = ref(props.deposit?.note ?? '')
const calendarOpen = ref(false)
const busy = ref(false)
const error = ref('')
async function submit() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    if (props.mode === 'plan') {
      if (limited.value && deadline.value < formatDate(new Date()) && deadline.value !== props.plan?.deadline) throw new Error('目标日期不能早于今天')
      await savePlan(db, { id: props.plan?.id, createdAt: props.plan?.createdAt, name: name.value, targetAmount: parseSavingsAmount(target.value), defaultAmount: parseSavingsAmount(defaultAmount.value), deadline: limited.value ? deadline.value : undefined })
    } else {
      if (!props.plan) throw new Error('存钱计划不存在')
      await saveDeposit(db, { id: props.deposit?.id, occurredAt: props.deposit?.occurredAt, planId: props.plan.id, amount: parseSavingsAmount(amount.value), note: note.value.trim() })
    }
    emit('saved')
  } catch (reason) { error.value = reason instanceof Error ? reason.message : '保存失败，请重试' }
  finally { busy.value = false }
}
</script>

<template>
  <Teleport to="body">
    <div class="savings-overlay" @click.self="!busy && emit('close')" @keydown.esc="!busy && emit('close')">
      <section class="savings-sheet" role="dialog" aria-modal="true" :aria-label="mode === 'plan' ? (plan ? '编辑计划' : '新增存钱计划') : (deposit ? '编辑存入记录' : '存一笔')">
        <header><div><small>{{ mode === 'plan' ? '让期待慢慢实现' : plan?.name }}</small><h2>{{ mode === 'plan' ? (plan ? '编辑计划' : '新增存钱计划') : (deposit ? '编辑存入记录' : '为心愿存一笔') }}</h2></div><button type="button" aria-label="关闭弹窗" :disabled="busy" @click="emit('close')">×</button></header>
        <form @submit.prevent="submit">
          <template v-if="mode === 'plan'">
            <label>计划名称<input v-model="name" aria-label="计划名称" maxlength="40" placeholder="例如：环游世界、我的第一辆车" required autofocus /></label>
            <div class="type-options"><button type="button" :aria-pressed="!limited" @click="limited = false"><b>慢慢攒</b><small>只设金额 · 无期限</small></button><button type="button" :aria-pressed="limited" @click="limited = true"><b>按时攒</b><small>设定日期 · 如期实现</small></button></div>
            <label>目标金额（元）<input v-model="target" aria-label="目标金额" inputmode="decimal" placeholder="想存到多少？" required /></label>
            <label>每次默认存入（元）<input v-model="defaultAmount" aria-label="每次默认存入" inputmode="decimal" placeholder="例如：100" required /></label>
            <small class="hint">只是默认金额，每次都可以少存或多存。</small>
            <label v-if="limited">目标完成日期<button class="date-field" type="button" @click="calendarOpen = true">{{ deadline }} <span>选择日期 ›</span></button></label>
          </template>
          <template v-else>
            <label>本次存入（元）<input v-model="amount" aria-label="存入金额" inputmode="decimal" required autofocus /></label>
            <small class="hint">默认每次 {{ (plan!.defaultAmount / 100).toFixed(2) }} 元，本次金额可自由调整。</small>
            <label>备注（选填）<textarea v-model="note" aria-label="存入备注" maxlength="200" rows="2" placeholder="记录这份小小的坚持" /></label>
          </template>
          <p v-if="error" role="alert" class="form-error">{{ error }}</p>
          <button class="save" type="submit" :disabled="busy">{{ busy ? '正在保存…' : mode === 'plan' ? '保存计划' : '确认存入' }}</button>
        </form>
      </section>
    </div>
    <DatePickerSheet v-if="calendarOpen" :model-value="deadline" :min="today" title="目标完成日期" @close="calendarOpen = false" @select="deadline = $event; calendarOpen = false" />
  </Teleport>
</template>

<style scoped>
.savings-overlay{position:fixed;z-index:140;inset:0;background:rgba(35,29,26,.45);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center}.savings-sheet{width:min(100%,430px);max-height:92dvh;overflow-y:auto;padding:24px 22px calc(24px + var(--safe-bottom));border-radius:28px 28px 0 0;background:var(--surface)}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}header small,.hint{color:var(--muted);font-size:12px;line-height:1.6}h2{font-size:22px;margin:5px 0 0}header>button{border:0;background:var(--surface-soft);border-radius:50%;width:36px;height:36px;font-size:24px}form{display:grid;gap:17px}label{display:grid;gap:8px;font-size:13px;font-weight:650}input,textarea,.date-field{width:100%;min-height:48px;padding:13px;border:1px solid var(--border);border-radius:13px;background:var(--paper);color:var(--ink);font-size:15px;outline:none}input:focus,textarea:focus{border-color:var(--primary)}textarea{resize:vertical}.hint{margin-top:-10px}.type-options{display:grid;grid-template-columns:1fr 1fr;gap:10px}.type-options button{padding:13px 10px;text-align:left;display:grid;gap:5px;border:1px solid var(--border);border-radius:14px;background:var(--paper)}.type-options button[aria-pressed=true]{border-color:var(--primary);background:var(--primary-soft)}.type-options small{font-size:11px;color:var(--muted)}.date-field{display:flex;justify-content:space-between}.date-field span{font-size:12px;color:var(--muted)}.save{min-height:48px;border:0;border-radius:14px;background:var(--primary);color:white;font-weight:700}.save:disabled{opacity:.6}.form-error{color:var(--expense);font-size:13px;margin:0}
</style>
