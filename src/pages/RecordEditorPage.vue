<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecordEditor from '../features/records/RecordEditor.vue'
import { processImage } from '../features/images/imageService'
import { db } from '../shared/db/database'
import { createRecordRepository } from '../features/records/recordRepository'
import { createId } from '../shared/id/createId'
import type { RecordDraft } from '../features/records/types'

const router = useRouter()
const route = useRoute()
const busy = ref(false)
const error = ref('')
const initial = ref<RecordDraft>()
const repository = createRecordRepository(db)
const editingId = typeof route.params.id === 'string' ? route.params.id : ''
onMounted(async () => {
  if (!editingId) return
  const record = await db.records.get(editingId)
  if (!record) { error.value = '账目不存在'; return }
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...draft } = record
  initial.value = draft
})

async function save(payload: RecordDraft & { files: File[] }) {
  busy.value = true; error.value = ''
  try {
    const { files, ...draft } = payload
    const processed = await Promise.all(files.map(processImage))
    await db.transaction('rw', db.records, db.images, async () => {
      const ids = processed.map(() => createId())
      const imageIds = [...draft.imageIds, ...ids]
      const record = editingId
        ? await repository.updateRecord(editingId, { ...draft, imageIds })
        : await repository.createRecord({ ...draft, imageIds })
      await db.images.bulkAdd(processed.map((image, index) => ({
        id: ids[index], recordId: record.id, name: files[index].name,
        mimeType: image.mimeType, size: image.blob.size, blob: image.blob,
        thumbnailBlob: image.thumbnailBlob, createdAt: new Date().toISOString(),
      })))
    })
    await router.push('/')
  } catch (reason) {
    error.value = reason instanceof DOMException && reason.name === 'QuotaExceededError'
      ? '手机存储空间不足，请先导出备份并清理空间'
      : reason instanceof Error ? reason.message : '保存失败，请重试'
  } finally { busy.value = false }
}
</script>
<template><RecordEditor :busy="busy" :error="error" :initial="initial" @save="save" @cancel="$router.back()" /></template>
