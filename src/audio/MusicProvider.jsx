import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectMusicEnabled, selectScreen } from '../store/uiSlice'
import { trackFor } from './track'

/**
 * Background music.
 *
 * One <audio> element lives here at the app root, so navigating between
 * screens never restarts the track. The on/off flag is Redux state
 * (`ui.musicEnabled`); the element itself is not, because it is an imperative
 * resource rather than serialisable data.
 *
 * Which track a screen plays comes from ./track.js. Screens sharing a track
 * still hand over without a restart — the effect below is keyed on the URL, so
 * it only re-runs when the track actually changes, which today means walking
 * into or out of the battle room.
 */
export function MusicProvider({ children }) {
  const enabled = useSelector(selectMusicEnabled)
  const screen = useSelector(selectScreen)
  const trackUrl = trackFor(screen)
  const audioRef = useRef(null)

  // One element per track. Same URL across a navigation means no re-run, so the
  // track plays on uninterrupted.
  useEffect(() => {
    if (!trackUrl) return
    const audio = new Audio(trackUrl)
    audio.loop = true
    audio.volume = 0.4
    audio.preload = 'auto'
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [trackUrl])

  // Follow the flag. Browsers block autoplay until the page has been
  // interacted with, so if play() is rejected we arm a one-shot listener and
  // start on the first click or keypress instead.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!enabled) {
      audio.pause()
      return
    }

    let cleanup = () => {}

    audio.play().catch(() => {
      const start = () => {
        // Re-check: the player may have switched it off while waiting.
        if (audioRef.current && !audioRef.current.paused) return
        audio.play().catch(() => {})
        cleanup()
      }
      window.addEventListener('pointerdown', start, { once: true })
      window.addEventListener('keydown', start, { once: true })
      cleanup = () => {
        window.removeEventListener('pointerdown', start)
        window.removeEventListener('keydown', start)
      }
    })

    return () => cleanup()
  }, [enabled, trackUrl])

  return children
}
