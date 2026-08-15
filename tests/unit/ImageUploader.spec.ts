import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ImageUploader from '../../src/features/images/ImageUploader.vue'

describe('ImageUploader', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
      revokeObjectURL: vi.fn(),
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('supports multiple images and shows their contents immediately', async () => {
    const wrapper = mount(ImageUploader)
    const input = wrapper.get<HTMLInputElement>('input[type=file]')
    expect(input.attributes('multiple')).toBeDefined()
    expect(input.attributes('accept')).toBe('image/*')
    Object.defineProperty(input.element, 'files', {
      value: [
        new File(['a'], 'one.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'two.png', { type: 'image/png' }),
      ],
    })
    await input.trigger('change')

    expect(wrapper.findAll('[data-testid=image-preview]')).toHaveLength(2)
    expect(wrapper.get('img[alt="one.jpg"]').attributes('src')).toBe('blob:one.jpg')
    expect(wrapper.emitted('update:files')?.[0]?.[0]).toHaveLength(2)
  })

  it('removes a preview and revokes its object URL', async () => {
    const wrapper = mount(ImageUploader)
    const input = wrapper.get<HTMLInputElement>('input[type=file]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['a'], 'one.jpg', { type: 'image/jpeg' })],
    })
    await input.trigger('change')
    await wrapper.get('[aria-label="删除 one.jpg"]').trigger('click')

    expect(wrapper.findAll('[data-testid=image-preview]')).toHaveLength(0)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:one.jpg')
  })
})
