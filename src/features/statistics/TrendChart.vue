<script setup lang="ts">
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props = defineProps<{ labels: string[]; values: number[]; type: 'bar' | 'line'; color: string }>()
const root = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer])
function render() {
  if (!root.value) return
  chart ??= echarts.init(root.value)
  chart.setOption({
    grid: { left: 8, right: 8, top: 16, bottom: 22, containLabel: true },
    xAxis: { type: 'category', data: props.labels, axisLine: { lineStyle: { color: '#c9c7c0' } }, axisTick: { show: false } },
    yAxis: { type: 'value', show: false }, tooltip: { trigger: 'axis' },
    series: [{ type: props.type, data: props.values.map((value) => value / 100), smooth: true, symbol: 'none', itemStyle: { color: props.color }, lineStyle: { width: 4, color: props.color }, barMaxWidth: 24 }],
  })
}
watch(() => [props.labels, props.values, props.type], render, { deep: true })
onMounted(() => { render(); window.addEventListener('resize', render) })
onBeforeUnmount(() => { window.removeEventListener('resize', render); chart?.dispose() })
</script>
<template><div ref="root" class="trend-chart" aria-label="收支趋势图" /></template>
<style scoped>.trend-chart { width: 100%; height: 180px; }</style>
