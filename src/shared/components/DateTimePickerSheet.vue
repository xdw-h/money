<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

const props = defineProps<{ modelValue: string; title?: string }>()
const emit = defineEmits<{ close: []; select: [value: string] }>()
const [initialDate, initialTime = '00:00'] = props.modelValue.split('T')
const selectedDate = ref(initialDate)
const visibleMonth = ref(initialDate.slice(0, 7))
const [initialHour, initialMinute] = initialTime.split(':').map(Number)
const hour = ref(initialHour)
const minute = ref(initialMinute)
const timePickerOpen = ref(false)
const monthPickerOpen = ref(false)
const hours = Array.from({ length: 24 }, (_, index) => index)
const minutes = Array.from({ length: 60 }, (_, index) => index)
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 101 }, (_, index) => currentYear - 50 + index)
const months = Array.from({ length: 12 }, (_, index) => index + 1)
const hourList = ref<HTMLElement>()
const minuteList = ref<HTMLElement>()
const yearList = ref<HTMLElement>()
const monthList = ref<HTMLElement>()

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
  const values = [...Array(firstWeekday).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)] as Array<number | null>
  return [...values, ...Array(42 - values.length).fill(null)]
})
const selected = computed(() => `${selectedDate.value}T${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`)
const timeLabel = computed(() => `${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`)

async function toggleMonthPicker() {
  monthPickerOpen.value = !monthPickerOpen.value
  if (!monthPickerOpen.value) return
  timePickerOpen.value = false
  await nextTick()
  const [year, month] = visibleMonth.value.split('-').map(Number)
  if (yearList.value) yearList.value.scrollTop = (year - years[0]) * 36
  if (monthList.value) monthList.value.scrollTop = (month - 1) * 36
}

function setVisibleYear(year: number) {
  const month = Number(visibleMonth.value.slice(5, 7))
  visibleMonth.value = monthKey(year, month)
}

function setVisibleMonth(month: number, close = true) {
  const year = Number(visibleMonth.value.slice(0, 4))
  visibleMonth.value = monthKey(year, month)
  if (close) monthPickerOpen.value = false
}

function syncDateWheel(type: 'year' | 'month', event: Event) {
  const target = event.currentTarget as HTMLElement
  const index = Math.round(target.scrollTop / 36)
  if (type === 'year') setVisibleYear(years[Math.max(0, Math.min(years.length - 1, index))])
  else setVisibleMonth(Math.max(1, Math.min(12, index + 1)), false)
}

async function toggleTimePicker() {
  timePickerOpen.value = !timePickerOpen.value
  if (!timePickerOpen.value) return
  monthPickerOpen.value = false
  await nextTick()
  if (hourList.value) hourList.value.scrollTop = hour.value * 36
  if (minuteList.value) minuteList.value.scrollTop = minute.value * 36
}

function syncWheel(type: 'hour' | 'minute', event: Event) {
  const target = event.currentTarget as HTMLElement
  const max = type === 'hour' ? 23 : 59
  const value = Math.max(0, Math.min(max, Math.round(target.scrollTop / 36)))
  if (type === 'hour') hour.value = value
  else minute.value = value
}

function selectMinute(value: number) {
  minute.value = value
  timePickerOpen.value = false
}
</script>

<template>
  <div class="picker-overlay" @click.self="emit('close')">
    <section class="datetime-picker-sheet" role="dialog" aria-modal="true" :aria-label="title || '选择日期时间'">
      <div class="month-nav"><button class="month-trigger" data-action="toggle-month-picker" type="button" :aria-expanded="monthPickerOpen" aria-label="快速选择年份和月份" @click="toggleMonthPicker"><b>{{ monthLabel }}</b><span class="month-chevron" aria-hidden="true"></span></button><div><button type="button" aria-label="上个月" @click="moveMonth(-1)">‹</button><button type="button" aria-label="下个月" @click="moveMonth(1)">›</button></div></div>
      <div class="calendar-stage">
        <template v-if="!monthPickerOpen">
          <div class="weekdays"><span v-for="day in ['日','一','二','三','四','五','六']" :key="day">{{ day }}</span></div>
          <div class="days"><span v-for="(day, index) in days" :key="index" data-calendar-cell><button v-if="day" type="button" :data-day="day" :class="{ selected: selectedDate === dateKey(day) }" @click="selectedDate = dateKey(day)">{{ day }}</button></span></div>
        </template>
        <div v-else class="date-wheel-picker" role="group" aria-label="选择年份和月份">
          <div class="date-selection-band" aria-hidden="true"></div>
          <section><b>年份</b><div ref="yearList" class="date-wheel-list" aria-label="选择年份" @scroll="syncDateWheel('year', $event)"><button v-for="value in years" :key="value" type="button" :data-year="value" :class="{ selected: visibleMonth.startsWith(`${value}-`) }" @click="setVisibleYear(value)">{{ value }}年</button></div></section>
          <section><b>月份</b><div ref="monthList" class="date-wheel-list" aria-label="选择月份" @scroll="syncDateWheel('month', $event)"><button v-for="value in months" :key="value" type="button" :data-month="value" :class="{ selected: Number(visibleMonth.slice(5, 7)) === value }" @click="setVisibleMonth(value)">{{ value }}月</button></div></section>
        </div>
        <div v-if="timePickerOpen" class="time-picker" role="group" aria-label="选择时间" @click.stop>
          <div class="selection-band" data-selection-band aria-hidden="true"></div>
          <section><b>小时</b><div ref="hourList" class="time-list" aria-label="选择小时" @scroll="syncWheel('hour', $event)"><button v-for="value in hours" :key="value" type="button" :data-hour="String(value).padStart(2, '0')" :class="{ selected: hour === value }" @click="hour = value">{{ String(value).padStart(2, '0') }}</button></div></section>
          <span>:</span>
          <section><b>分钟</b><div ref="minuteList" class="time-list" aria-label="选择分钟" @scroll="syncWheel('minute', $event)"><button v-for="value in minutes" :key="value" type="button" :data-minute="String(value).padStart(2, '0')" :class="{ selected: minute === value }" @click="selectMinute(value)">{{ String(value).padStart(2, '0') }}</button></div></section>
        </div>
      </div>
      <div class="time-row"><strong>时间</strong><button data-action="toggle-time" type="button" :aria-expanded="timePickerOpen" @click="toggleTimePicker">已选择 {{ timeLabel }}</button></div>
      <div class="picker-actions"><button class="cancel" data-action="cancel" type="button" @click="emit('close')">取消</button><button class="confirm" data-action="confirm" type="button" @click="emit('select', selected)">确定</button></div>
    </section>
  </div>
</template>

<style scoped>
.picker-overlay{position:fixed;z-index:185;inset:0;display:flex;align-items:flex-end;background:rgba(40,34,31,.52);backdrop-filter:blur(3px)}
.datetime-picker-sheet{box-sizing:border-box;width:min(calc(100% - 16px),430px);max-height:calc(100dvh - 16px);margin:0 auto;padding:18px 16px calc(16px + var(--safe-bottom));display:grid;gap:14px;overflow-x:hidden;overflow-y:hidden;border-radius:26px 26px 0 0;background:var(--surface);box-shadow:0 -18px 50px rgba(35,27,23,.25)}
.month-nav{display:flex;align-items:center;justify-content:space-between}.month-nav>div{display:flex;gap:8px}.month-nav>div button{width:38px;height:38px;border:0;border-radius:12px;background:var(--surface-soft);color:var(--primary);font-size:25px}.month-trigger{min-height:38px;display:flex;align-items:center;gap:8px;padding:0;border:0;background:transparent;color:var(--ink)}.month-trigger b{font-size:18px}.month-chevron{box-sizing:border-box;width:8px;height:8px;border-right:2px solid var(--primary);border-bottom:2px solid var(--primary);transform:translateY(-2px) rotate(45deg)}.calendar-stage{position:relative;height:276px;display:grid;grid-template-rows:auto 1fr;gap:6px}
.weekdays,.days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.weekdays span{text-align:center;color:var(--muted);font-size:9px}.days{grid-template-rows:repeat(6,minmax(0,1fr));min-height:0}.days span{min-height:0;display:grid;place-items:center}.days button{aspect-ratio:1;width:min(100%,38px);height:auto;border:0;border-radius:50%;background:transparent;color:var(--ink);font-size:12px}.days button.selected{background:var(--primary);color:#fff;font-weight:700;box-shadow:0 5px 14px color-mix(in srgb,var(--primary) 35%,transparent)}
.date-wheel-picker{position:relative;grid-row:1 / -1;min-height:0;display:grid;grid-template-columns:1.35fr 1fr;gap:14px;padding:0 24px;overflow:hidden}.date-wheel-picker>section{position:relative;z-index:1;min-width:0;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:6px}.date-wheel-picker b{text-align:center;color:var(--muted);font-size:10px}.date-selection-band{position:absolute;z-index:0;left:24px;right:24px;top:calc(50% + 8px);height:36px;transform:translateY(-50%);border-radius:12px;background:var(--surface-soft);pointer-events:none}.date-wheel-list{box-sizing:border-box;min-height:0;display:flex;flex-direction:column;padding-block:102px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;scroll-snap-type:y mandatory}.date-wheel-list::-webkit-scrollbar{display:none}.date-wheel-list button{flex:0 0 36px;border:0;background:transparent;color:var(--muted);font-size:16px;scroll-snap-align:center}.date-wheel-list button.selected{color:var(--ink);font-weight:700}
.time-picker{position:absolute;z-index:2;left:50%;top:50%;width:min(82%,310px);box-sizing:border-box;transform:translate(-50%,-45%);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:12px;overflow:hidden;border:1px solid color-mix(in srgb,var(--primary) 18%,var(--border));border-radius:20px;background:color-mix(in srgb,var(--surface) 94%,var(--primary-soft));box-shadow:0 18px 44px rgba(35,27,23,.2)}.time-picker>section{position:relative;z-index:1;min-width:0;display:grid;gap:5px}.time-picker b{text-align:center;color:var(--muted);font-size:10px}.time-picker>span{position:relative;z-index:2;color:var(--primary);font-size:22px;font-weight:700}.selection-band{position:absolute;z-index:0;left:12px;right:12px;top:calc(50% + 7px);height:32px;transform:translateY(-50%);border-radius:11px;background:linear-gradient(to right,var(--primary) 0 47%,transparent 47% 53%,var(--primary) 53% 100%);filter:drop-shadow(0 5px 7px color-mix(in srgb,var(--primary) 28%,transparent));pointer-events:none}.time-list{box-sizing:border-box;height:176px;display:flex;flex-direction:column;gap:4px;padding-block:72px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;scroll-snap-type:y mandatory}.time-list::-webkit-scrollbar{display:none}.time-list button{flex:0 0 32px;border:0;border-radius:11px;background:transparent;color:var(--muted);font-size:16px;scroll-snap-align:center}.time-list button.selected{color:#fff;font-weight:700}
.time-row{min-height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 4px}.time-row strong{font-size:14px}.time-row button{min-width:92px;min-height:38px;padding:0 14px;border:0;border-radius:13px;background:var(--primary-soft);color:var(--primary);font-size:16px;font-weight:700}.time-row button:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.picker-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.picker-actions button{min-height:46px;border:0;border-radius:14px;font-size:14px;font-weight:700}.cancel{background:var(--surface-soft);color:var(--ink)}.confirm{background:var(--primary);color:#fff}
@media (max-height:700px){.datetime-picker-sheet{gap:8px;padding-top:12px}.calendar-stage{height:198px}.date-wheel-list{padding-block:63px}.time-picker{transform:translate(-50%,-44%)}.time-list{height:144px}.time-row{min-height:40px}.picker-actions button{min-height:42px}}
</style>
