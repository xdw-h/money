import notesData from './release-notes.json'

export type ReleaseNote = { version: string; date: string; title: string; items: string[] }
export const releaseNotes = notesData satisfies ReleaseNote[]
export const latestRelease = releaseNotes[0]
const VIEWED_RELEASE_KEY = 'money-viewed-release-version'

export const shouldShowLatestRelease = () => Boolean(latestRelease) && localStorage.getItem(VIEWED_RELEASE_KEY) !== latestRelease.version
export const markLatestReleaseViewed = () => {
  if (latestRelease) localStorage.setItem(VIEWED_RELEASE_KEY, latestRelease.version)
}
