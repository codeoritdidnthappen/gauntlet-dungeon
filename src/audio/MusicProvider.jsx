import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectMusicEnabled } from '../store/uiSlice'
import { TRACK_URL } from './track'

/**
 * Background music.
 *
 * One <audio> element lives here at the app root, so navigating between
 * screens never restarts the track. The on/off flag is Redux state
 * (`ui.musicEnabled`); the element itself is not, because it is an imperative
 * resource rather than serialisable data.
 *
 * The track itself comes from ./track.js.
 */
export function MusicProvider({ children }) {
  const enabled = useSelector(selectMusicEnabled)
  const audioRef = useRef(null)

  // Create the element once.
  useEffect(() => {
    if (!TRACK_URL) return
    const audio = new Audio(TRACK_URL)
    audio.loop = true
    audio.volume = 0.4
    audio.preload = 'auto'
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

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
  }, [enabled])

  return children
}
