/**
 * Background music.
 *
 * Every .mp3 in /audio is picked up automatically, and which one plays depends
 * on the screen: the battle room has its own, everything else shares the
 * default. That mapping has to name files, so renaming one in /audio means
 * renaming it here too — the cost of having more than one track.
 *
 * Lives in its own module rather than beside MusicProvider so that file only
 * exports a component (keeps React Fast Refresh working).
 */
const tracks = import.meta.glob('../../audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byFilename = Object.fromEntries(
  Object.entries(tracks).map(([path, url]) => [path.split('/').pop(), url]),
)

/** Played by every screen without an entry below. */
const DEFAULT_TRACK = 'Creeping_Anxiety-Dager-Ekstrom.mp3'

const SCREEN_TRACKS = {
  room: 'Run-Naeselius.mp3',
}

/** Whether there is any music at all — the toggle hides itself when there isn't. */
export const HAS_MUSIC = Object.keys(byFilename).length > 0

/** The track a screen plays, or null when that file is not in /audio. */
export function trackFor(screen) {
  return byFilename[SCREEN_TRACKS[screen] ?? DEFAULT_TRACK] ?? null
}
