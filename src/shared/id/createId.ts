function randomBytes(length: number) {
  const bytes = new Uint8Array(length)
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.getRandomValues) return cryptoApi.getRandomValues(bytes)
  for (let index = 0; index < length; index++) bytes[index] = Math.floor(Math.random() * 256)
  return bytes
}

export function createId() {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID()

  const bytes = randomBytes(16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
