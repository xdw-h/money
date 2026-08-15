<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ key: [key: string] }>()
const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫']
</script>
<template>
  <div class="keypad">
    <button v-for="key in keys" :key="key" type="button" :data-key="key" :disabled="disabled" @click="emit('key', key)">{{ key }}</button>
  </div>
</template>
<style scoped>
.keypad { display: grid; grid-template-columns: repeat(3, 1fr); overflow:hidden;border:1px solid var(--border);border-radius:18px;background:var(--surface); }
.keypad button { min-height: 52px; border: 0; border-right:1px solid var(--border);border-bottom:1px solid var(--border); background: transparent; font-size: 20px; font-weight: 650; }
.keypad button:nth-child(3n){border-right:0}.keypad button:nth-last-child(-n+3){border-bottom:0}.keypad button:active { background:#fff1ec; }
</style>
