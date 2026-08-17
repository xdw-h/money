<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ key: [key: string] }>()
const keys = ['1','2','3','⌫','4','5','6','.','7','8','9','0']
</script>
<template>
  <div class="keypad">
    <button v-for="key in keys" :key="key" type="button" :data-key="key" :disabled="disabled" @click="emit('key', key)">{{ key }}</button>
  </div>
</template>
<style scoped>
.keypad { display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:7px;border-radius:18px;background:var(--primary-soft) }
.keypad button { min-height:clamp(42px,6vh,50px);border:0;border-radius:13px;background:color-mix(in srgb,var(--surface) 78%,transparent);color:var(--text);font-size:20px;font-weight:650;box-shadow:0 2px 7px rgba(var(--shadow),.05) }
.keypad button:active { transform:scale(.97);background:var(--surface) }
</style>
