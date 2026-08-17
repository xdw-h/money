<script setup lang="ts">
import { ref } from 'vue'
import PatternLock from './PatternLock.vue'
import { useBodyScrollLock } from '../../shared/ui/useBodyScrollLock'
import { configurePattern, configurePin, disableAppLock, getAppLockType, hasAppLock, verifyCredential, type AppLockType } from './appLockStore'

const emit = defineEmits<{ close: []; saved: [] }>()
type Step = 'manage' | 'choose' | 'verify' | 'enter' | 'confirm'
const step = ref<Step>(hasAppLock() ? 'manage' : 'choose')
const selectedType = ref<AppLockType>('pin')
const currentType = ref(getAppLockType())
const pendingAction = ref<'disable' | 'change'>('change')
const firstCredential = ref<string | number[] | null>(null)
const pin = ref('')
const error = ref('')
useBodyScrollLock()

const choose = (type: AppLockType) => { selectedType.value = type; pin.value = ''; error.value = ''; step.value = 'enter' }
const beginProtectedAction = (action: 'disable' | 'change') => { pendingAction.value = action; pin.value = ''; error.value = ''; step.value = 'verify' }
const validateCurrent = async (credential: string | number[]) => {
  if (!await verifyCredential(credential)) { error.value = '当前密码或手势错误'; pin.value = ''; return }
  if (pendingAction.value === 'disable') { disableAppLock(); emit('saved'); emit('close'); return }
  step.value = 'choose'
}
const next = () => {
  if (!/^\d{6}$/.test(pin.value)) { error.value = '请输入6位数字密码'; return }
  firstCredential.value = pin.value; pin.value = ''; error.value = ''; step.value = 'confirm'
}
const capturePattern = (pattern: number[]) => {
  if (step.value === 'verify') { void validateCurrent(pattern); return }
  if (step.value === 'enter') { firstCredential.value = pattern; step.value = 'confirm'; error.value = ''; return }
  void savePattern(pattern)
}
const savePin = async () => {
  if (pin.value !== firstCredential.value) { error.value = '两次输入不一致，请重新输入'; return }
  await configurePin(pin.value); emit('saved'); emit('close')
}
const savePattern = async (pattern: number[]) => {
  if (JSON.stringify(pattern) !== JSON.stringify(firstCredential.value)) { error.value = '两次手势不一致，请重新绘制'; return }
  await configurePattern(pattern); emit('saved'); emit('close')
}
</script>

<template>
  <div class="lock-sheet-overlay" @click.self="emit('close')" @touchmove.self.prevent>
    <section class="lock-sheet" role="dialog" aria-modal="true" aria-label="应用锁设置">
      <header><div><strong>应用锁</strong><small>离开应用 5 分钟后自动锁定</small></div><button type="button" aria-label="关闭应用锁设置" @click="emit('close')">×</button></header>
      <template v-if="step === 'manage'">
        <div class="lock-enabled">✓ 已开启{{ currentType === 'pin' ? '6位数字密码' : '九宫格手势' }}</div>
        <button class="primary" type="button" @click="beginProtectedAction('change')">切换解锁方式</button>
        <button class="danger" type="button" @click="beginProtectedAction('disable')">关闭应用锁</button>
      </template>
      <template v-else-if="step === 'choose'">
        <p>选择解锁方式</p>
        <button class="choice" type="button" aria-label="选择数字密码" @click="choose('pin')"><b>••••••</b><span>6位数字密码</span></button>
        <button class="choice" type="button" aria-label="选择九宫格手势" @click="choose('pattern')"><b>⌘</b><span>九宫格手势</span></button>
      </template>
      <template v-else-if="step === 'verify'">
        <p>请先验证当前{{ currentType === 'pin' ? '密码' : '手势' }}</p>
        <template v-if="currentType === 'pin'"><input v-model="pin" type="password" inputmode="numeric" maxlength="6" aria-label="输入当前6位密码" /><button class="primary" type="button" @click="validateCurrent(pin)">验证</button></template>
        <PatternLock v-else @complete="capturePattern" />
      </template>
      <template v-else>
        <p>{{ step === 'enter' ? '设置新的' : '再次确认' }}{{ selectedType === 'pin' ? '6位密码' : '手势' }}</p>
        <template v-if="selectedType === 'pin'">
          <input v-model="pin" type="password" inputmode="numeric" maxlength="6" :aria-label="step === 'enter' ? '输入6位密码' : '再次输入6位密码'" />
          <button v-if="step === 'enter'" class="primary" type="button" aria-label="下一步" @click="next">下一步</button>
          <button v-else class="primary" type="button" aria-label="保存应用锁" @click="savePin">保存</button>
        </template>
        <PatternLock v-else @complete="capturePattern" />
      </template>
      <p v-if="error" class="sheet-error" role="alert">{{ error }}</p>
    </section>
  </div>
</template>

<style scoped>
.lock-sheet-overlay{position:fixed;z-index:140;inset:0;display:flex;align-items:flex-end;background:rgba(34,30,28,.48);backdrop-filter:blur(3px)}.lock-sheet{width:min(100%,430px);max-height:92dvh;margin:0 auto;padding:20px 20px calc(22px + env(safe-area-inset-bottom));display:grid;gap:13px;overflow:auto;border-radius:28px 28px 0 0;background:var(--surface)}header{display:flex;align-items:center;justify-content:space-between}header div{display:grid;gap:3px}header strong{font-size:19px}header small{color:var(--muted);font-size:10px}header button{width:36px;height:36px;border:0;border-radius:50%;background:var(--surface-soft);font-size:22px}.lock-sheet>p{margin:4px 0;color:var(--muted);font-size:12px}.choice{min-height:64px;padding:10px 14px;display:flex;align-items:center;gap:13px;border:1px solid var(--border);border-radius:16px;background:var(--surface-soft);text-align:left}.choice b{width:44px;color:var(--primary);font-size:19px}.choice span{font-weight:700}.lock-sheet input{height:50px;padding:0 16px;border:1px solid var(--border);border-radius:14px;background:var(--surface-soft);color:var(--text);font-size:20px;letter-spacing:8px}.primary,.danger{min-height:46px;border:0;border-radius:14px;font-weight:700}.primary{background:var(--primary);color:white}.danger{background:color-mix(in srgb,var(--expense) 10%,var(--surface));color:var(--expense)}.lock-enabled{padding:15px;border-radius:15px;background:var(--primary-soft);color:var(--primary);font-weight:700}.sheet-error{color:var(--expense)!important;text-align:center}
</style>
<style scoped>
.lock-sheet-overlay{overscroll-behavior:none}.lock-sheet{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
</style>
