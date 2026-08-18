<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ modelValue: string; title?: string }>()
const emit = defineEmits<{ close: []; select: [value: string] }>()
const [initialYear, initialMonth] = props.modelValue.split('-').map(Number)
const year = ref(initialYear)
const month = ref(initialMonth)
const selected = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`)
function moveYear(offset: number) { year.value += offset }
</script>

<template>
  <div class="picker-overlay" @click.self="emit('close')">
    <section class="month-picker-sheet" role="dialog" aria-modal="true" :aria-label="title || '选择月份'">
      <header><div><strong>{{ title || '选择月份' }}</strong><small>{{ selected }}</small></div><button type="button" aria-label="关闭月份选择" @click="emit('close')">×</button></header>
      <div class="year-nav"><button type="button" aria-label="上一年" @click="moveYear(-1)">‹</button><b>{{ year }}年</b><button type="button" aria-label="下一年" @click="moveYear(1)">›</button></div>
      <div class="months"><button v-for="value in 12" :key="value" type="button" :data-month="String(value).padStart(2, '0')" :class="{ selected: month === value }" @click="month = value">{{ value }}月</button></div>
      <button class="confirm" data-action="confirm" type="button" @click="emit('select', selected)">确定：{{ selected }}</button>
    </section>
  </div>
</template>

<style scoped>
.picker-overlay{position:fixed;z-index:185;inset:0;display:flex;align-items:flex-end;background:rgba(40,34,31,.52);backdrop-filter:blur(3px)}
.month-picker-sheet{width:min(calc(100% - 16px),430px);margin:0 auto;padding:17px 16px calc(18px + var(--safe-bottom));display:grid;gap:14px;border-radius:26px 26px 0 0;background:var(--surface);box-shadow:0 -18px 50px rgba(35,27,23,.25)}
header,.year-nav{display:flex;align-items:center;justify-content:space-between}header>div{display:grid;gap:2px}header strong{font-size:17px}header small{color:var(--muted);font-size:10px}
header button,.year-nav button{border:0;background:var(--surface-soft);color:var(--primary)}header button{width:36px;height:36px;border-radius:50%;font-size:22px}.year-nav button{width:42px;height:40px;border-radius:12px;font-size:26px}.year-nav b{font-size:15px}
.months{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.months button{min-height:50px;border:1px solid var(--border);border-radius:14px;background:var(--surface-soft);color:var(--ink);font-size:13px}.months button.selected{border-color:var(--primary);background:var(--primary);color:#fff;font-weight:700;box-shadow:0 6px 16px color-mix(in srgb,var(--primary) 28%,transparent)}
.confirm{min-height:46px;border:0;border-radius:14px;background:var(--primary);color:#fff;font-size:13px;font-weight:700}
</style>
