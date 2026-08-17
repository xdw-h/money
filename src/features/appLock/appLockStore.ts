import { ref } from 'vue'

export type AppLockType = 'pin' | 'pattern'
type StoredLock = { type: AppLockType; salt: string; verifier: string }

export const APP_LOCK_KEY = 'money-app-lock-v1'
const BACKGROUNDED_AT_KEY = 'money-app-backgrounded-at'
const LOCK_TIMEOUT_MS = 5 * 60 * 1000

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
const credentialText = (credential: string | number[]) => Array.isArray(credential) ? credential.join('-') : credential

const deriveVerifier = async (credential: string | number[], salt: Uint8Array) => {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(credentialText(credential)), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: 120_000 }, material, 256)
  return bytesToBase64(new Uint8Array(bits))
}

const readLock = (): StoredLock | null => {
  try { return JSON.parse(localStorage.getItem(APP_LOCK_KEY) ?? 'null') as StoredLock | null }
  catch { return null }
}

const saveCredential = async (type: AppLockType, credential: string | number[]) => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const verifier = await deriveVerifier(credential, salt)
  localStorage.setItem(APP_LOCK_KEY, JSON.stringify({ type, salt: bytesToBase64(salt), verifier } satisfies StoredLock))
  appUnlocked.value = true
}

export const appUnlocked = ref(readLock() === null)
export const getAppLockType = () => readLock()?.type ?? null
export const hasAppLock = () => readLock() !== null

export const configurePin = async (pin: string) => {
  if (!/^\d{6}$/.test(pin)) throw new Error('请输入6位数字密码')
  await saveCredential('pin', pin)
  return true
}

export const configurePattern = async (pattern: number[]) => {
  if (pattern.length < 4) throw new Error('手势至少连接4个点')
  if (new Set(pattern).size !== pattern.length) throw new Error('手势不能重复连接同一个点')
  if (pattern.some((point) => point < 1 || point > 9)) throw new Error('手势轨迹无效')
  await saveCredential('pattern', pattern)
  return true
}

export const verifyCredential = async (credential: string | number[]) => {
  const stored = readLock()
  if (!stored) return true
  if (stored.type === 'pin' && typeof credential !== 'string') return false
  if (stored.type === 'pattern' && !Array.isArray(credential)) return false
  const verifier = await deriveVerifier(credential, base64ToBytes(stored.salt))
  return verifier === stored.verifier
}

export const disableAppLock = () => {
  localStorage.removeItem(APP_LOCK_KEY)
  sessionStorage.removeItem(BACKGROUNDED_AT_KEY)
  appUnlocked.value = true
}

export const lockApp = () => { if (hasAppLock()) appUnlocked.value = false }
export const unlockSession = () => {
  appUnlocked.value = true
  sessionStorage.removeItem(BACKGROUNDED_AT_KEY)
}
export const markBackgrounded = (now = Date.now()) => sessionStorage.setItem(BACKGROUNDED_AT_KEY, String(now))
export const requiresUnlock = (now = Date.now()) => {
  const value = Number(sessionStorage.getItem(BACKGROUNDED_AT_KEY))
  return Number.isFinite(value) && value > 0 && now - value >= LOCK_TIMEOUT_MS
}
