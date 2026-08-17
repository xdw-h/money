<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{ complete: [pattern: number[]] }>()
const selected = ref<number[]>([])
const drawing = ref(false)
const pointer = ref({ x: 0, y: 0 })
const suppressClick = ref(false)
const grid = ref<HTMLElement>()
const centers = Array.from({ length: 9 }, (_, index) => ({ x: 16.667 + index % 3 * 33.333, y: 16.667 + Math.floor(index / 3) * 33.333 }))
const lines = computed(() => selected.value.slice(1).map((point, index) => ({ from: centers[selected.value[index] - 1], to: centers[point - 1] })))

const select = (point: number) => {
  if (!selected.value.includes(point)) selected.value.push(point)
}
const reset = () => { selected.value = [] }
const confirm = () => {
  if (selected.value.length < 4) return
  emit('complete', [...selected.value])
  reset()
}
const pointFromEvent = (event: PointerEvent) => Number((document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-pattern-point]') as HTMLElement | null)?.dataset.patternPoint || 0)
const updatePointer = (event: PointerEvent) => {
  const bounds = grid.value?.getBoundingClientRect(); if (!bounds) return
  pointer.value = { x: (event.clientX - bounds.left) / bounds.width * 100, y: (event.clientY - bounds.top) / bounds.height * 100 }
}
const startDrawing = (point: number, event: PointerEvent) => { event.preventDefault(); drawing.value = true; selected.value = []; select(point); updatePointer(event) }
const continueDrawing = (event: PointerEvent) => { if (!drawing.value) return; event.preventDefault(); updatePointer(event); const point = pointFromEvent(event); if (point) select(point) }
const enterPoint = (point: number) => { if (drawing.value) select(point) }
const finishDrawing = () => {
  if (!drawing.value) return
  drawing.value = false; suppressClick.value = true
  if (selected.value.length >= 4) confirm()
  window.setTimeout(() => { suppressClick.value = false }, 0)
}
const clickSelect = (point: number) => { if (!suppressClick.value) select(point) }

defineExpose({ reset })
</script>

<template>
  <div class="pattern-lock">
    <div ref="grid" class="pattern-grid" aria-label="九宫格手势" @pointermove="continueDrawing" @pointerup="finishDrawing" @pointercancel="finishDrawing" @pointerleave="finishDrawing">
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><line v-for="(line,index) in lines" :key="index" :x1="line.from.x" :y1="line.from.y" :x2="line.to.x" :y2="line.to.y" /><line v-if="drawing && selected.length" :x1="centers[selected[selected.length-1]-1].x" :y1="centers[selected[selected.length-1]-1].y" :x2="pointer.x" :y2="pointer.y" /></svg>
      <button v-for="point in 9" :key="point" type="button" :data-pattern-point="point" :class="{ selected: selected.includes(point) }" :aria-label="`手势点${point}`" @pointerdown="startDrawing(point,$event)" @pointerenter="enterPoint(point)" @click="clickSelect(point)"><i /></button>
    </div>
    <button class="pattern-confirm" type="button" aria-label="确认手势" :disabled="selected.length < 4" @click="confirm">确认手势</button>
    <button v-if="selected.length" class="pattern-reset" type="button" @click="reset">重新绘制</button>
  </div>
</template>

<style scoped>
.pattern-lock{display:grid;justify-items:center;gap:14px}.pattern-grid{width:224px;height:224px;padding:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px;border-radius:28px;background:color-mix(in srgb,var(--surface) 88%,transparent)}.pattern-grid button{display:grid;place-items:center;border:0;background:transparent}.pattern-grid i{width:22px;height:22px;border:3px solid var(--muted);border-radius:50%;background:var(--surface);transition:.16s}.pattern-grid button.selected i{border-color:var(--primary);background:var(--primary);box-shadow:0 0 0 8px var(--primary-soft)}.pattern-confirm{min-width:150px;min-height:44px;border:0;border-radius:14px;background:var(--primary);color:white;font-weight:700}.pattern-confirm:disabled{opacity:.35}.pattern-reset{border:0;background:transparent;color:var(--muted);font-size:12px}
.pattern-grid{position:relative;touch-action:none;user-select:none}.pattern-grid svg{position:absolute;z-index:0;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}.pattern-grid line{stroke:var(--primary);stroke-width:3.5;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:.8}.pattern-grid button{position:relative;z-index:1}
</style>
