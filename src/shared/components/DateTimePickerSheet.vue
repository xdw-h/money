<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{ modelValue: string; title?: string }>()
const emit = defineEmits<{ close: []; select: [value: string] }>()
const [initialDate, initialTime = '00:00'] = props.modelValue.split('T')
const selectedDate = ref(initialDate)
const visibleMonth = ref(initialDate.slice(0, 7))
const [initialHour, initialMinute] = initialTime.split(':').map(Number)
const hour = ref(initialHour)
const minute = ref(initialMinute)
const hours = Array.from({ length: 24 }, (_, index) => index)
const minutes = Array.from({ length: 60 }, (_, index) => index)
const hourList = ref<HTMLElement>()
const minuteList = ref<HTMLElement>()

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
  return [...Array(firstWeekday).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)] as Array<number | null>
})
const selected = computed(() => `${selectedDate.value}T${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`)

onMounted(() => {
  for (const list of [hourList.value, minuteList.value]) {
    const active = list?.querySelector('.selected') as HTMLElement | null
    active?.scrollIntoView?.({ block: 'center' })
  }
})
</script>

<template>
  <div class="picker-overlay" @click.self="emit('close')">
    <section class="datetime-picker-sheet" role="dialog" aria-modal="true" :aria-label="title || '选择日期时间'">
      <header><div><strong>{{ title || '选择日期时间' }}</strong><small>{{ selected.replace('T', ' ') }}</small></div><button type="button" aria-label="关闭日期时间选择" @click="emit('close')">×</button></header>
      <div class="month-nav"><button type="button" aria-label="上个月" @click="moveMonth(-1)">‹</button><b>{{ monthLabel }}</b><button type="button" aria-label="下个月" @click="moveMonth(1)">›</button></div>
      <div class="weekdays"><span v-for="day in ['日','一','二','三','四','五','六']" :key="day">{{ day }}</span></div>
      <div class="days"><span v-for="(day, index) in days" :key="index"><button v-if="day" type="button" :data-day="day" :class="{ selected: selectedDate === dateKey(day) }" @click="selectedDate = dateKey(day)">{{ day }}</button></span></div>
      <div class="time-picker">
        <section><b>小时</b><div ref="hourList" class="time-list" aria-label="选择小时"><button v-for="value in hours" :key="value" type="button" :data-hour="String(value).padStart(2, '0')" :class="{ selected: hour === value }" @click="hour = value">{{ String(value).padStart(2, '0') }}</button></div></section>
        <span>:</span>
        <section><b>分钟</b><div ref="minuteList" class="time-list" aria-label="选择分钟"><button v-for="value in minutes" :key="value" type="button" :data-minute="String(value).padStart(2, '0')" :class="{ selected: minute === value }" @click="minute = value">{{ String(value).padStart(2, '0') }}</button></div></section>
      </div>
      <button class="confirm" data-action="confirm" type="button" @click="emit('select', selected)">确定：{{ selected.replace('T', ' ') }}</button>
    </section>
  </div>
</template>

<style scoped>
.picker-overlay{position:fixed;z-index:185;inset:0;display:flex;align-items:flex-end;background:rgba(40,34,31,.52);backdrop-filter:blur(3px)}
.datetime-picker-sheet{width:min(calc(100% - 16px),430px);max-height:94dvh;margin:0 auto;padding:14px 14px calc(16px + var(--safe-bottom));display:grid;gap:9px;overflow:auto;border-radius:26px 26px 0 0;background:var(--surface);box-shadow:0 -18px 50px rgba(35,27,23,.25)}
header,.month-nav{display:flex;align-items:center;justify-content:space-between}header>div{display:grid;gap:2px}header strong{font-size:17px}header small{color:var(--muted);font-size:10px}header button,.month-nav button{border:0;background:var(--surface-soft);color:var(--primary)}header button{width:36px;height:36px;border-radius:50%;font-size:22px}.month-nav button{width:38px;height:36px;border-radius:12px;font-size:25px}.month-nav b{font-size:14px}
.weekdays,.days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.weekdays span{text-align:center;color:var(--muted);font-size:9px}.days span{aspect-ratio:1;display:grid;place-items:center}.days button{width:100%;height:100%;border:0;border-radius:50%;background:transparent;color:var(--ink);font-size:12px}.days button.selected{background:var(--primary);color:#fff;font-weight:700;box-shadow:0 5px 14px color-mix(in srgb,var(--primary) 35%,transparent)}
.time-picker{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:8px;padding:8px;border-radius:16px;background:var(--surface-soft)}.time-picker>section{min-width:0;display:grid;gap:5px}.time-picker b{text-align:center;color:var(--muted);font-size:10px}.time-picker>span{align-self:center;color:var(--primary);font-size:22px;font-weight:700}.time-list{height:92px;display:grid;gap:4px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;scroll-snap-type:y proximity}.time-list::-webkit-scrollbar{display:none}.time-list button{min-height:36px;border:1px solid transparent;border-radius:10px;background:var(--surface);color:var(--ink);scroll-snap-align:center}.time-list button.selected{border-color:var(--primary);background:var(--primary);color:#fff;font-weight:700}
.confirm{min-height:44px;border:0;border-radius:14px;background:var(--primary);color:#fff;font-size:13px;font-weight:700}
@media (max-height:700px){.datetime-picker-sheet{gap:6px}.days span{aspect-ratio:auto;height:29px}.time-list{height:72px}}
</style>
