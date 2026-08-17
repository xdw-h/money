import { readFile, writeFile } from 'node:fs/promises'

const workerPath = new URL('../dist/sw.js', import.meta.url)
const worker = await readFile(workerPath, 'utf8')
const version = `${Date.now()}`

if (!worker.includes('__BUILD_VERSION__')) {
  throw new Error('Service worker build version placeholder is missing')
}

await writeFile(workerPath, worker.replaceAll('__BUILD_VERSION__', version), 'utf8')
