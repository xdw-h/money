import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/money/' : '/',
  plugins: [vue()],
  build: { chunkSizeWarningLimit: 550 },
  test: { environment: 'jsdom', include: ['tests/unit/**/*.spec.ts'] },
}))
