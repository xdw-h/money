<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { assertImageFile } from './imageService'

interface Preview { file: File; url: string }
const emit = defineEmits<{ 'update:files': [files: File[]] }>()
const previews = ref<Preview[]>([])
const error = ref('')

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

onBeforeUnmount(() => previews.value.forEach(({ url }) => URL.revokeObjectURL(url)))
</script>

<template>
  <section class="image-uploader">
    <div class="preview-grid">
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
.preview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
figure, .upload-tile { position: relative; aspect-ratio: 1; margin: 0; border: 1px dashed var(--border); border-radius: 12px; overflow: hidden; background: var(--surface-soft); }
figure img { width: 100%; height: 100%; object-fit: cover; display: block; }
figure button { position: absolute; top: 3px; right: 3px; width: 26px; height: 26px; border: 0; border-radius: 50%; color: white; background: rgba(0,0,0,.72); }
.upload-tile { display: grid; place-content: center; text-align: center; cursor: pointer; }
.upload-tile span { font-size: 28px; line-height: 1; }
.upload-tile input { position: absolute; opacity: 0; inset: 0; width: 100%; }
.field-error { color: var(--expense); font-size: 13px; }
</style>
