<script setup lang="ts">
const props = defineProps<{ disabled?: boolean; saveDisabled?: boolean }>()
const emit = defineEmits<{ key: [key: string]; save: [] }>()
const keys = [
  { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }, { id: '⌫', label: '⌫' },
  { id: '4', label: '4' }, { id: '5', label: '5' }, { id: '6', label: '6' }, { id: '-', label: '−' },
  { id: '7', label: '7' }, { id: '8', label: '8' }, { id: '9', label: '9' }, { id: '+', label: '+' },
  { id: 'blank', label: '' }, { id: '0', label: '0' }, { id: '.', label: '.' }, { id: 'save', label: '保存' },
]
function press(id: string) {
  if (id === 'save') emit('save')
  else if (id !== 'blank') emit('key', id)
}
</script>
<template>
  <div class="keypad">
    <button v-for="key in keys" :key="key.id" type="button" :data-key="key.id" :class="{ blank:key.id === 'blank', save:key.id === 'save' }" :disabled="disabled || key.id === 'blank' || (key.id === 'save' && saveDisabled)" @click="press(key.id)">{{ key.label }}</button>
  </div>
</template>
<style scoped>
.keypad { display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:7px;border-radius:18px;background:var(--primary-soft) }
.keypad button { min-height:clamp(42px,6vh,50px);border:0;border-radius:13px;background:color-mix(in srgb,var(--surface) 78%,transparent);color:var(--text);font-size:20px;font-weight:650;box-shadow:0 2px 7px rgba(var(--shadow),.05) }
.keypad button:active { transform:scale(.97);background:var(--surface) }
.keypad button.blank{visibility:hidden}.keypad button.save{background:color-mix(in srgb,var(--primary) 24%,var(--surface));color:var(--primary);font-size:14px}.keypad button:disabled:not(.blank){opacity:.45}
</style>
