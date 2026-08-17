<script setup lang="ts">
import { ref } from 'vue'
import PatternLock from './PatternLock.vue'
import { getAppLockType, unlockSession, verifyCredential } from './appLockStore'

const emit = defineEmits<{ recover: [] }>()
const type = getAppLockType()
const pin = ref('')
const error = ref('')
const busy = ref(false)
const keys = ['1','2','3','4','5','6','7','8','9','0','删除']

const submit = async (credential: string | number[]) => {
  busy.value = true
  const valid = await verifyCredential(credential)
  busy.value = false
  if (valid) { error.value = ''; unlockSession(); return }
  error.value = type === 'pin' ? '密码错误，请重新输入' : '手势错误，请重新绘制'
  pin.value = ''
}
const press = async (key: string) => {
  if (busy.value) return
  if (key === '删除') { pin.value = pin.value.slice(0, -1); return }
  if (pin.value.length >= 6) return
  pin.value += key
  if (pin.value.length === 6) await submit(pin.value)
}
</script>

<template>
  <main class="app-lock-screen">
    <section class="lock-card">
      <div class="lock-mark" aria-hidden="true">⌾</div>
      <h1>记账</h1>
      <p>{{ type === 'pattern' ? '请绘制解锁手势' : '请输入6位密码' }}</p>
      <template v-if="type === 'pin'">
        <div class="pin-dots" aria-label="密码输入进度"><i v-for="index in 6" :key="index" :class="{ filled: pin.length >= index }" /></div>
        <div class="pin-keypad">
          <button v-for="key in keys" :key="key" type="button" :class="{ delete: key === '删除' }" :aria-label="key === '删除' ? '删除一位' : `数字${key}`" @click="press(key)">{{ key }}</button>
        </div>
      </template>
      <PatternLock v-else @complete="submit" />
      <p v-if="error" class="lock-error" role="alert">{{ error }}</p>
      <button class="forgot" type="button" @click="emit('recover')">忘记密码或手势？</button>
    </section>
  </main>
</template>

<style scoped>
.app-lock-screen{position:fixed;z-index:200;inset:0;min-height:100dvh;padding:calc(42px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom));display:grid;place-items:center;background:var(--paper);background-image:linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px);background-size:24px 24px}.lock-card{width:min(100%,360px);display:grid;justify-items:center;gap:12px}.lock-mark{width:68px;height:68px;display:grid;place-items:center;border-radius:23px;background:var(--primary);color:white;box-shadow:0 12px 28px color-mix(in srgb,var(--primary) 30%,transparent);font-size:36px}.lock-card h1{margin:4px 0 0;font-size:24px}.lock-card>p{margin:0;color:var(--muted);font-size:13px}.pin-dots{height:42px;display:flex;align-items:center;gap:15px}.pin-dots i{width:11px;height:11px;border:2px solid var(--primary);border-radius:50%}.pin-dots i.filled{background:var(--primary)}.pin-keypad{width:260px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.pin-keypad button{height:58px;border:1px solid var(--border);border-radius:18px;background:var(--surface);font-size:20px;font-weight:650;box-shadow:0 5px 15px color-mix(in srgb,var(--primary) 7%,transparent)}.pin-keypad button:nth-last-child(2){grid-column:2}.pin-keypad .delete{font-size:11px}.lock-card .lock-error{min-height:18px;color:var(--expense)}.forgot{border:0;background:transparent;color:var(--primary);font-size:12px}
</style>
