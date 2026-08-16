import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('PWA assets', () => {
  it('provides an installable manifest and offline service worker', async () => {
    const manifest = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8'))
    const worker = await readFile('public/sw.js', 'utf8')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    expect(manifest.name).toBe('记账')
    expect(manifest.short_name).toBe('记账')
    expect(manifest.icons[0].src).toBe('./icon.svg?v=2')
    expect(worker).toContain("self.addEventListener('fetch'")
    expect(worker).toContain("self.addEventListener('install'")
  })
})
