import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const notes = JSON.parse(await readFile(new URL('../src/features/releaseNotes/release-notes.json', import.meta.url), 'utf8'))
if (!Array.isArray(notes) || notes[0]?.version !== packageJson.version) {
  throw new Error(`发布公告缺失：最新公告版本必须为 ${packageJson.version}`)
}
