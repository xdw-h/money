<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { assertImageFile } from './imageService'
import type { ImageEntity } from '../records/types'

interface Preview { file: File; url: string }
interface ExistingPreview { id: string; name: string; url: string }
const props = defineProps<{ existingImages?: Array<Pick<ImageEntity, 'id' | 'name' | 'thumbnailBlob'>> }>()
const emit = defineEmits<{ 'update:files': [files: File[]]; 'update:retainedImageIds': [ids: string[]] }>()
const previews = ref<Preview[]>([])
const existingPreviews = ref<ExistingPreview[]>([])
const error = ref('')

watch(() => props.existingImages, (images) => {
  existingPreviews.value.forEach(({ url }) => URL.revokeObjectURL(url))
  existingPreviews.value = (images ?? []).map((image) => ({ id: image.id, name: image.name, url: URL.createObjectURL(image.thumbnailBlob) }))
}, { immediate: true })

function selectFiles(event: Event) {
  error.value = ''
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  for (const file of files) {
    try {
      assertImageFile(file)
      previews.value.push({ file, url: URL.createObjectURL(file) })
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '图片读取失败'
    }
  }
  emit('update:files', previews.value.map(({ file }) => file))
  ;(event.target as HTMLInputElement).value = ''
}

function remove(index: number) {
  URL.revokeObjectURL(previews.value[index].url)
  previews.value.splice(index, 1)
  emit('update:files', previews.value.map(({ file }) => file))
}

function removeExisting(index: number) {
  URL.revokeObjectURL(existingPreviews.value[index].url)
  existingPreviews.value.splice(index, 1)
  emit('update:retainedImageIds', existingPreviews.value.map(({ id }) => id))
}

onBeforeUnmount(() => [...previews.value, ...existingPreviews.value].forEach(({ url }) => URL.revokeObjectURL(url)))
</script>

<template>
  <section class="image-uploader">
    <div class="preview-grid">
      <figure v-for="(preview, index) in existingPreviews" :key="preview.id" data-testid="image-preview">
        <img :src="preview.url" :alt="preview.name" />
        <button type="button" :aria-label="`删除 ${preview.name}`" @click="removeExisting(index)">×</button>
      </figure>
      <figure v-for="(preview, index) in previews" :key="preview.url" data-testid="image-preview">
        <img :src="preview.url" :alt="preview.file.name" />
        <button type="button" :aria-label="`删除 ${preview.file.name}`" @click="remove(index)">×</button>
      </figure>
      <label class="upload-tile">
        <span>＋</span><small>照片</small>
        <input type="file" accept="image/*" multiple @change="selectFiles" />
      </label>
    </div>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.preview-grid { display:flex;gap:5px }
figure, .upload-tile { position:relative;flex:0 0 38px;width:38px;height:38px;margin:0;border:1px dashed var(--border);border-radius:10px;overflow:hidden;background:var(--surface-soft) }
figure img { width: 100%; height: 100%; object-fit: cover; display: block; }
figure button { position:absolute;top:2px;right:2px;width:17px;height:17px;padding:0;border:0;border-radius:50%;color:white;background:rgba(0,0,0,.72);font-size:11px }
.upload-tile { display: grid; place-content: center; text-align: center; cursor: pointer; }
.upload-tile span { font-size:18px;line-height:1 }.upload-tile small{font-size:8px}
.upload-tile input { position: absolute; opacity: 0; inset: 0; width: 100%; }
.field-error { margin:3px 0 0;color:var(--expense);font-size:9px }
</style>
