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
const timeLabel = computed(() => `${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`)

async function toggleTimePicker() {
  timePickerOpen.value = !timePickerOpen.value
  if (!timePickerOpen.value) return
  await nextTick()
  for (const list of [hourList.value, minuteList.value]) {
    const active = list?.querySelector('.selected') as HTMLElement | null
    active?.scrollIntoView?.({ block: 'center' })
  }
}

function selectMinute(value: number) {
  minute.value = value
  timePickerOpen.value = false
}
</script>

<template>
  <div class="picker-overlay" @click.self="emit('close')">
    <section class="datetime-picker-sheet" role="dialog" aria-modal="true" :aria-label="title || '选择日期时间'">
      <div class="month-nav"><b>{{ monthLabel }}</b><div><button type="button" aria-label="上个月" @click="moveMonth(-1)">‹</button><button type="button" aria-label="下个月" @click="moveMonth(1)">›</button></div></div>
      <div class="calendar-stage">
        <div class="weekdays"><span v-for="day in ['日','一','二','三','四','五','六']" :key="day">{{ day }}</span></div>
        <div class="days"><span v-for="(day, index) in days" :key="index"><button v-if="day" type="button" :data-day="day" :class="{ selected: selectedDate === dateKey(day) }" @click="selectedDate = dateKey(day)">{{ day }}</button></span></div>
        <div v-if="timePickerOpen" class="time-picker" role="group" aria-label="选择时间" @click.stop>
          <section><b>小时</b><div ref="hourList" class="time-list" aria-label="选择小时"><button v-for="value in hours" :key="value" type="button" :data-hour="String(value).padStart(2, '0')" :class="{ selected: hour === value }" @click="hour = value">{{ String(value).padStart(2, '0') }}</button></div></section>
          <span>:</span>
          <section><b>分钟</b><div ref="minuteList" class="time-list" aria-label="选择分钟"><button v-for="value in minutes" :key="value" type="button" :data-minute="String(value).padStart(2, '0')" :class="{ selected: minute === value }" @click="selectMinute(value)">{{ String(value).padStart(2, '0') }}</button></div></section>
        </div>
      </div>
      <div class="time-row"><strong>时间</strong><button data-action="toggle-time" type="button" :aria-expanded="timePickerOpen" @click="toggleTimePicker">{{ timeLabel }}</button></div>
      <div class="picker-actions"><button class="cancel" data-action="cancel" type="button" @click="emit('close')">取消</button><button class="confirm" data-action="confirm" type="button" @click="emit('select', selected)">确定</button></div>
    </section>
  </div>
</template>

<style scoped>
.picker-overlay{position:fixed;z-index:185;inset:0;display:flex;align-items:flex-end;background:rgba(40,34,31,.52);backdrop-filter:blur(3px)}
.datetime-picker-sheet{box-sizing:border-box;width:min(calc(100% - 16px),430px);max-height:calc(100dvh - 16px);margin:0 auto;padding:18px 16px calc(16px + var(--safe-bottom));display:grid;gap:14px;overflow-x:hidden;overflow-y:hidden;border-radius:26px 26px 0 0;background:var(--surface);box-shadow:0 -18px 50px rgba(35,27,23,.25)}
.month-nav{display:flex;align-items:center;justify-content:space-between}.month-nav>div{display:flex;gap:8px}.month-nav button{width:38px;height:38px;border:0;border-radius:12px;background:var(--surface-soft);color:var(--primary);font-size:25px}.month-nav b{font-size:18px}.calendar-stage{position:relative;display:grid;gap:6px}
.weekdays,.days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.weekdays span{text-align:center;color:var(--muted);font-size:9px}.days span{aspect-ratio:1;display:grid;place-items:center}.days button{width:100%;height:100%;border:0;border-radius:50%;background:transparent;color:var(--ink);font-size:12px}.days button.selected{background:var(--primary);color:#fff;font-weight:700;box-shadow:0 5px 14px color-mix(in srgb,var(--primary) 35%,transparent)}
.time-picker{position:absolute;z-index:2;left:50%;top:50%;width:min(82%,310px);box-sizing:border-box;transform:translate(-50%,-45%);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:12px;border:1px solid color-mix(in srgb,var(--primary) 18%,var(--border));border-radius:20px;background:color-mix(in srgb,var(--surface) 94%,var(--primary-soft));box-shadow:0 18px 44px rgba(35,27,23,.2)}.time-picker>section{min-width:0;display:grid;gap:5px}.time-picker b{text-align:center;color:var(--muted);font-size:10px}.time-picker>span{color:var(--primary);font-size:22px;font-weight:700}.time-list{height:176px;display:grid;gap:4px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;scroll-snap-type:y mandatory}.time-list::-webkit-scrollbar{display:none}.time-list button{min-height:32px;border:0;border-radius:11px;background:transparent;color:var(--muted);font-size:16px;scroll-snap-align:center}.time-list button.selected{background:var(--primary);color:#fff;font-weight:700}
.time-row{min-height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 4px}.time-row strong{font-size:14px}.time-row button{min-width:92px;min-height:38px;padding:0 14px;border:0;border-radius:13px;background:var(--primary-soft);color:var(--primary);font-size:16px;font-weight:700}.time-row button:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.picker-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.picker-actions button{min-height:46px;border:0;border-radius:14px;font-size:14px;font-weight:700}.cancel{background:var(--surface-soft);color:var(--ink)}.confirm{background:var(--primary);color:#fff}
@media (max-height:700px){.datetime-picker-sheet{gap:8px;padding-top:12px}.days span{aspect-ratio:auto;height:29px}.time-picker{transform:translate(-50%,-44%)}.time-list{height:144px}.time-row{min-height:40px}.picker-actions button{min-height:42px}}
</style>
