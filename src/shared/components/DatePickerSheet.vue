<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ modelValue: string; min?: string; title?: string }>()
const emit = defineEmits<{ close: []; select: [value: string] }>()
const selected = ref(props.modelValue)
const visibleMonth = ref(props.modelValue.slice(0, 7))

function monthKey(year: number, month: number) { return `${year}-${String(month).padStart(2, '0')}` }
function moveMonth(offset: number) {
  const [year, month] = visibleMonth.value.split('-').map(Number)
  const date = new Date(year, month - 1 + offset, 1)
  visibleMonth.value = monthKey(date.getFullYear(), date.getMonth() + 1)
}
function dateKey(day: number) { return `${visibleMonth.value}-${String(day).padStart(2, '0')}` }
const monthLabel = computed(() => { const [year, month] = visibleMonth.value.split('-').map(Number); return `${year}年${month}月` })
const days = computed(() => {
  const [year, month] = visibleMonth.value.split('-').map(Number)
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const count = new Date(year, month, 0).getDate()
  return [...Array(firstWeekday).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)]
})
function choose(day: number) {
  const value = dateKey(day)
  if (!props.min || value >= props.min) selected.value = value
}
function confirm() { emit('select', selected.value) }
</script>

<template>
  <div class="date-picker-overlay" @click.self="emit('close')">
    <section class="date-picker-sheet" role="dialog" aria-modal="true" :aria-label="title || '选择日期'">
      <header><div><strong>{{ title || '选择日期' }}</strong><small>{{ selected }}</small></div><button type="button" aria-label="关闭日期选择" @click="emit('close')">×</button></header>
      <div class="month-nav"><button type="button" aria-label="上个月" @click="moveMonth(-1)">‹</button><b>{{ monthLabel }}</b><button type="button" aria-label="下个月" @click="moveMonth(1)">›</button></div>
      <div class="weekdays"><span v-for="day in ['日','一','二','三','四','五','六']" :key="day">{{ day }}</span></div>
      <div class="days"><span v-for="(_, index) in days" :key="index"><button v-if="days[index]" type="button" :class="{ selected: selected === dateKey(days[index]!), disabled: Boolean(min && dateKey(days[index]!) < min) }" :disabled="Boolean(min && dateKey(days[index]!) < min)" @click="choose(days[index]!)">{{ days[index] }}</button></span></div>
      <button class="confirm" type="button" @click="confirm">确定：{{ selected }}</button>
    </section>
  </div>
</template>

<style scoped>
.date-picker-overlay{position:fixed;z-index:180;inset:0;display:flex;align-items:flex-end;background:rgba(40,34,31,.52);backdrop-filter:blur(3px)}.date-picker-sheet{width:min(calc(100% - 16px),430px);margin:0 auto;padding:17px 16px calc(18px + var(--safe-bottom));display:grid;gap:13px;border-radius:26px 26px 0 0;background:var(--surface);box-shadow:0 -18px 50px rgba(35,27,23,.25)}header,.month-nav{display:flex;align-items:center;justify-content:space-between}header>div{display:grid;gap:2px}header strong{font-size:17px}header small{color:var(--muted);font-size:10px}header button,.month-nav button{border:0;background:var(--surface-soft);color:var(--primary)}header button{width:36px;height:36px;border-radius:50%;font-size:22px}.month-nav button{width:38px;height:38px;border-radius:12px;font-size:26px}.month-nav b{font-size:14px}.weekdays,.days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.weekdays span{text-align:center;color:var(--muted);font-size:10px}.days span{aspect-ratio:1;display:grid;place-items:center}.days button{width:100%;height:100%;border:0;border-radius:50%;background:transparent;color:var(--ink);font-size:13px}.days button.selected{background:var(--primary);color:white;font-weight:700;box-shadow:0 5px 14px color-mix(in srgb,var(--primary) 35%,transparent)}.days button.disabled{color:var(--border)}.confirm{min-height:46px;border:0;border-radius:14px;background:var(--primary);color:white;font-size:13px;font-weight:700}
</style>
