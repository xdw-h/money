<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ complete: [pattern: number[]] }>()
const selected = ref<number[]>([])

const select = (point: number) => {
  if (!selected.value.includes(point)) selected.value.push(point)
}
const reset = () => { selected.value = [] }
const confirm = () => {
  if (selected.value.length < 4) return
  emit('complete', [...selected.value])
  reset()
}

defineExpose({ reset })
</script>

<template>
  <div class="pattern-lock">
    <div class="pattern-grid" aria-label="九宫格手势">
      <button v-for="point in 9" :key="point" type="button" :class="{ selected: selected.includes(point) }" :aria-label="`手势点${point}`" @click="select(point)"><i /></button>
    </div>
    <button class="pattern-confirm" type="button" aria-label="确认手势" :disabled="selected.length < 4" @click="confirm">确认手势</button>
    <button v-if="selected.length" class="pattern-reset" type="button" @click="reset">重新绘制</button>
  </div>
</template>

<style scoped>
.pattern-lock{display:grid;justify-items:center;gap:14px}.pattern-grid{width:224px;height:224px;padding:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px;border-radius:28px;background:color-mix(in srgb,var(--surface) 88%,transparent)}.pattern-grid button{display:grid;place-items:center;border:0;background:transparent}.pattern-grid i{width:22px;height:22px;border:3px solid var(--muted);border-radius:50%;background:var(--surface);transition:.16s}.pattern-grid button.selected i{border-color:var(--primary);background:var(--primary);box-shadow:0 0 0 8px var(--primary-soft)}.pattern-confirm{min-width:150px;min-height:44px;border:0;border-radius:14px;background:var(--primary);color:white;font-weight:700}.pattern-confirm:disabled{opacity:.35}.pattern-reset{border:0;background:transparent;color:var(--muted);font-size:12px}
</style>
