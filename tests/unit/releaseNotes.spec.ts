import { beforeEach, describe, expect, it } from 'vitest'
import packageJson from '../../package.json'
import notes from '../../src/features/releaseNotes/release-notes.json'
import { markLatestReleaseViewed, shouldShowLatestRelease } from '../../src/features/releaseNotes/releaseNotes'

describe('release notes', () => {
  beforeEach(() => localStorage.clear())

  it('matches the current application version', () => {
    expect(notes[0].version).toBe(packageJson.version)
    expect(notes[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(notes[0].title).toBe('日期选择体验优化')
  })

  it('automatically shows the latest announcement only once', () => {
    expect(shouldShowLatestRelease()).toBe(true)
    markLatestReleaseViewed()
    expect(shouldShowLatestRelease()).toBe(false)
  })
})
