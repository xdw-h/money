import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('PWA assets', () => {
  it('provides an installable manifest and offline service worker', async () => {
    const manifest = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8'))
    const worker = await readFile('public/sw.js', 'utf8')
    const html = await readFile('index.html', 'utf8')
    const styles = await readFile('src/styles/base.css', 'utf8')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    expect(manifest.name).toBe('记账')
    expect(manifest.short_name).toBe('记账')
    expect(manifest.icons[0].src).toBe('./icon.svg?v=2')
    expect(worker).toContain("self.addEventListener('fetch'")
    expect(worker).toContain("self.addEventListener('install'")
    expect(html).toContain('maximum-scale=1.0, user-scalable=no')
    expect(styles).toContain('touch-action: manipulation')
  })

  it('detects every release and lets the running app activate it safely', async () => {
    const worker = await readFile('public/sw.js', 'utf8')
    const main = await readFile('src/main.ts', 'utf8')
    const app = await readFile('src/App.vue', 'utf8')
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))

    expect(worker).toContain('__BUILD_VERSION__')
    expect(worker).toContain("data?.type === 'SKIP_WAITING'")
    expect(worker).not.toContain('then(() => self.skipWaiting())')
    expect(packageJson.scripts.build).toContain('stamp-service-worker.mjs')
    expect(main).toContain('startPwaUpdateChecks')
    expect(app).toContain('发现新版本')
  })

  it('builds production assets under the GitHub Pages repository path', async () => {
    const viteConfig = await readFile('vite.config.ts', 'utf8')
    expect(viteConfig).toContain("command === 'build' ? '/money/' : '/'")
  })
})
