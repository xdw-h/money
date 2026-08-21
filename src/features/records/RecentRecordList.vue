<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { categoryItems, loadCategories } from './categoryStore'
import { formatDateTime } from '../../shared/format/date'
import { formatMoney } from '../../shared/format/money'
import type { ImageEntity, RecordEntity } from './types'
import ImageGallery from '../images/ImageGallery.vue'
import IconDisplay from '../../shared/components/IconDisplay.vue'

const props = defineProps<{ records: RecordEntity[]; images?: ImageEntity[]; grouped?: boolean }>()
const emit = defineEmits<{ delete: [id: string]; edit: [id: string] }>()
const galleryOpen = ref(false)
const galleryImages = ref<{ id: string; url: string; name: string }[]>([])
const urls: string[] = []
loadCategories()
const names = computed(() => new Map(categoryItems.value.map((item) => [item.id, item])))
const imageMap = computed(() => new Map((props.images ?? []).map((item) => [item.id, item])))
function dayKey(value: string) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function dayLabel(key: string) {
  const date = new Date(`${key}T00:00:00`)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const difference = Math.round((today.getTime() - date.getTime()) / 86400000)
  const relative = difference === 0 ? '今天' : difference === 1 ? '昨天' : ''
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date)
  return `${date.getMonth() + 1}月${date.getDate()}日${relative ? ` ${relative}` : ''} ${weekday}`
}
const groups = computed(() => {
  const values = new Map<string, RecordEntity[]>()
  for (const record of props.records) { const key = dayKey(record.occurredAt); values.set(key, [...(values.get(key) ?? []), record]) }
  return [...values].map(([date, records]) => ({
    date, records,
    expense: records.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
    income: records.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
  }))
})
function openImages(record: RecordEntity) {
  galleryImages.value = record.imageIds.flatMap((id) => {
    const image = imageMap.value.get(id); if (!image) return []
    const url = URL.createObjectURL(image.blob); urls.push(url)
    return [{ id, url, name: image.name }]
  })
  galleryOpen.value = galleryImages.value.length > 0
}
onBeforeUnmount(() => urls.forEach(URL.revokeObjectURL))
</script>
<template>
  <div v-if="records.length" class="record-list" :class="{ grouped }">
    <template v-for="group in groups" :key="group.date">
      <header v-if="grouped" class="day-heading"><strong>{{ dayLabel(group.date) }}</strong><span><template v-if="group.expense">支出 {{ formatMoney(group.expense) }}</template><template v-if="group.expense && group.income"> · </template><template v-if="group.income">收入 {{ formatMoney(group.income) }}</template></span></header>
    <article v-for="record in group.records" :key="record.id" @click="openImages(record)">
      <span class="category-icon"><IconDisplay :icon="names.get(record.subcategoryId ?? '')?.icon ?? names.get(record.categoryId)?.icon ?? '✦'" /></span>
      <div><strong>{{ names.get(record.categoryId)?.name ?? '其他' }}<template v-if="record.subcategoryId"> · {{ names.get(record.subcategoryId)?.name ?? '子类' }}</template></strong><small><template v-if="!grouped">{{ formatDateTime(record.occurredAt) }} · </template>{{ record.note || '无备注' }}</small></div>
      <b :class="record.type">{{ formatMoney(record.amount) }}</b>
      <span v-if="record.imageIds.length" class="image-count">{{ record.imageIds.length }} 图</span>
      <div class="record-actions"><button type="button" :aria-label="`编辑 ${record.note || '账目'}`" @click.stop="emit('edit', record.id)">编辑</button><button type="button" :aria-label="`删除 ${record.note || '账目'}`" @click.stop="emit('delete', record.id)">删除</button></div>
    </article>
    </template>
  </div>
  <div v-else class="empty-state"><span>🧾</span><strong>还没有账目</strong><small>点击下方“＋”记下第一笔</small></div>
  <ImageGallery :open="galleryOpen" :images="galleryImages" @close="galleryOpen = false" />
</template>
<style scoped>
.record-list { display: grid; overflow:hidden; border:1px solid var(--border); border-radius:18px; background:var(--surface); }.day-heading{min-height:42px;padding:10px 12px 7px;display:flex;align-items:center;justify-content:space-between;background:var(--surface-soft);color:var(--muted)}.day-heading strong{color:var(--text);font-size:12px}.day-heading span{font-size:9px}.record-list article { position: relative; display: grid; grid-template-columns: 40px 1fr auto; align-items: center; gap: 8px 10px; padding: 12px; border-bottom: 1px solid var(--border); background: var(--surface); }.record-list article:last-child{border-bottom:0}.record-list.grouped article:last-of-type{border-bottom:1px solid var(--border)}.category-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background:#fff4eb;font-size:19px; }.record-list div { min-width: 0; display: grid; }.record-list strong{font-size:13px}.record-list small { color: var(--muted);font-size:10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.record-list b{font-size:12px}.income { color: var(--income); }.expense { color: var(--expense); }.image-count { position:absolute;right:12px;top:34px;font-size:9px;color:var(--muted) }.record-actions{grid-column:2/4!important;display:flex!important;justify-content:flex-end;gap:6px}.record-actions button{padding:5px 10px;border:0;border-radius:8px;background:var(--primary-soft);color:var(--primary);font-size:10px}.record-actions button:last-child{background:color-mix(in srgb,var(--expense) 12%,var(--surface));color:var(--expense)}.empty-state { min-height: 180px; display: grid; place-content: center; justify-items: center; gap: 7px; color: var(--muted); border:1px dashed var(--border);border-radius:18px;background:rgba(255,253,250,.7) }.empty-state span { width:50px;height:50px;display:grid;place-items:center;border-radius:16px;background:#fff1eb;font-size:25px; }.empty-state strong{font-size:15px}.empty-state small{font-size:11px}
</style>
