<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { db } from '../shared/db/database'
import { formatMoney } from '../shared/format/money'
import { categoryItems, loadCategories } from '../features/records/categoryStore'
import ImageGallery from '../features/images/ImageGallery.vue'
import type { ImageEntity, RecordEntity } from '../features/records/types'
import { activeLedger, activeLedgerId, loadLedgers } from '../features/ledgers/ledgerStore'

const records = ref<RecordEntity[]>([])
const images = ref<ImageEntity[]>([])
const galleryOpen = ref(false)
const galleryStart = ref(0)
const galleryImages = ref<{ id: string; url: string; name: string }[]>([])
const objectUrls: string[] = []

const categories = computed(() => new Map(categoryItems.value.map((item) => [item.id, item])))
const imageMap = computed(() => new Map(images.value.map((image) => [image.id, image])))

function dateParts(value: string) {
  const date = new Date(value)
  return {
    day: new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(date),
    year: date.getFullYear(),
    time: new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date),
    weekday: new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date),
  }
}

function thumbnailUrl(id: string) {
  const image = imageMap.value.get(id)
  if (!image) return ''
  const url = URL.createObjectURL(image.thumbnailBlob)
  objectUrls.push(url)
  return url
}

const entries = computed(() => records.value.map((record) => ({
  record,
  date: dateParts(record.occurredAt),
  category: categories.value.get(record.categoryId),
  subcategory: record.subcategoryId ? categories.value.get(record.subcategoryId) : undefined,
  thumbnails: record.imageIds.flatMap((id) => {
    const url = thumbnailUrl(id)
    return url ? [{ id, url }] : []
  }),
})))

function openImages(record: RecordEntity, selectedId: string) {
  galleryImages.value = record.imageIds.flatMap((id) => {
    const image = imageMap.value.get(id)
    if (!image) return []
    const url = URL.createObjectURL(image.blob)
    objectUrls.push(url)
    return [{ id, url, name: image.name }]
  })
  galleryStart.value = Math.max(0, galleryImages.value.findIndex((image) => image.id === selectedId))
  galleryOpen.value = galleryImages.value.length > 0
}

async function loadData() {
  ;[records.value, images.value] = await Promise.all([
    db.records.where('ledgerId').equals(activeLedgerId.value).reverse().sortBy('occurredAt'),
    db.images.toArray(),
  ])
}
onMounted(async () => { await Promise.all([loadCategories(), loadLedgers()]); await loadData() })
watch(activeLedgerId, loadData)
onBeforeUnmount(() => objectUrls.forEach(URL.revokeObjectURL))
</script>

<template>
  <main class="page timeline-page">
    <header><div><h1>记账时间轴</h1><small>{{ activeLedger?.icon }} {{ activeLedger?.name }} · 每一笔都是生活留下的刻度</small></div><span>◷</span></header>
    <section v-if="entries.length" class="timeline" aria-label="记账时间轴">
      <article v-for="entry in entries" :key="entry.record.id">
        <div class="date"><strong>{{ entry.date.day }}</strong><small>{{ entry.date.year }} · {{ entry.date.weekday }}</small><b>{{ entry.date.time }}</b></div>
        <i class="dot" :class="entry.record.type" />
        <div class="entry-card">
          <div class="entry-title"><span>{{ entry.category?.icon ?? '✦' }}</span><div><strong>{{ entry.category?.name ?? '其他' }}<template v-if="entry.subcategory"> · {{ entry.subcategory.name }}</template></strong><small>{{ entry.record.note || '无备注' }}</small></div><b :class="entry.record.type">{{ formatMoney(entry.record.amount) }}</b></div>
          <div v-if="entry.thumbnails.length" class="thumbnails">
            <button v-for="image in entry.thumbnails" :key="image.id" type="button" aria-label="查看记账凭证大图" @click="openImages(entry.record, image.id)"><img :src="image.url" alt="记账凭证缩略图" /></button>
          </div>
        </div>
      </article>
    </section>
    <section v-else class="empty"><span>◷</span><strong>时间轴还是空的</strong><small>记下第一笔后，它会出现在这里</small><RouterLink to="/record/new">记一笔</RouterLink></section>
    <ImageGallery :open="galleryOpen" :start="galleryStart" :images="galleryImages" @close="galleryOpen = false" />
  </main>
</template>

<style scoped>
.timeline-page{display:grid;gap:18px}.timeline-page>header{display:flex;align-items:center;justify-content:space-between}.timeline-page h1{margin:0 0 4px;font-size:22px}.timeline-page header small{color:var(--muted);font-size:11px}.timeline-page>header>span{width:42px;height:42px;display:grid;place-items:center;border:1px solid var(--border);border-radius:50%;background:var(--surface);color:var(--primary);font-size:22px}.timeline{position:relative;display:grid}.timeline::before{content:'';position:absolute;top:8px;bottom:18px;left:88px;width:2px;background:linear-gradient(var(--primary-soft),var(--primary),var(--primary-soft))}.timeline article{position:relative;display:grid;grid-template-columns:72px 20px 1fr;gap:7px;padding-bottom:18px}.date{padding-top:5px;display:grid;align-content:start;text-align:right}.date strong{font-size:12px}.date small{color:var(--muted);font-size:9px}.date b{margin-top:6px;color:var(--primary);font-size:11px}.dot{z-index:1;width:13px;height:13px;margin:10px auto 0;border:3px solid var(--surface);border-radius:50%;background:var(--primary);box-shadow:0 0 0 1px var(--primary)}.dot.expense{background:var(--expense);box-shadow:0 0 0 1px var(--expense)}.dot.income{background:var(--income);box-shadow:0 0 0 1px var(--income)}.entry-card{min-width:0;padding:12px;border:1px solid var(--border);border-radius:17px;background:var(--surface);box-shadow:0 7px 22px rgba(var(--shadow),.06)}.entry-title{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:9px}.entry-title>span{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:var(--surface-soft);font-size:19px}.entry-title>div{min-width:0;display:grid;gap:2px}.entry-title strong{overflow:hidden;font-size:12px;white-space:nowrap;text-overflow:ellipsis}.entry-title small{overflow:hidden;color:var(--muted);font-size:9px;white-space:nowrap;text-overflow:ellipsis}.entry-title>b{font-size:12px}.expense{color:var(--expense)}.income{color:var(--income)}.thumbnails{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}.thumbnails button{aspect-ratio:1;padding:0;overflow:hidden;border:0;border-radius:11px;background:var(--surface-soft)}.thumbnails img{width:100%;height:100%;display:block;object-fit:cover}.empty{min-height:52vh;display:grid;place-content:center;justify-items:center;gap:8px;color:var(--muted);text-align:center}.empty>span{width:58px;height:58px;display:grid;place-items:center;border-radius:20px;background:var(--primary-soft);color:var(--primary);font-size:28px}.empty strong{color:var(--text)}.empty small{font-size:11px}.empty a{margin-top:5px;padding:10px 24px;border-radius:12px;background:var(--primary);color:white;font-size:12px;font-weight:700}
</style>
