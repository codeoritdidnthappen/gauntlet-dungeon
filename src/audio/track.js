/**
 * The background music track.
 *
 * Whatever .mp3 sits in /audio is picked up automatically — drop a different
 * file in and it is used with no code change.
 *
 * Lives in its own module rather than beside MusicProvider so that file only
 * exports a component (keeps React Fast Refresh working).
 */
const tracks = import.meta.glob('../../audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const TRACK_URL = Object.values(tracks)[0] ?? null
