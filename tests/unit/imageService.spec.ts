import { describe, expect, it } from 'vitest'
import { assertImageFile, imageExtension } from '../../src/features/images/imageService'

describe('image service', () => {
  it('accepts common browser image formats', () => {
    expect(() => assertImageFile(new File(['a'], 'a.jpg', { type: 'image/jpeg' }))).not.toThrow()
    expect(imageExtension('image/png')).toBe('png')
  })

  it('rejects unsupported files and files larger than 20 MB', () => {
    expect(() => assertImageFile(new File(['x'], 'a.txt', { type: 'text/plain' }))).toThrow('仅支持图片')
    const large = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' })
    expect(() => assertImageFile(large)).toThrow('20 MB')
  })
})

