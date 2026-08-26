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
 * Which track a screen plays comes from ./track.js. Screens sharing a track are
 * left alone entirely; changing track swaps the src on the element that is
 * already there.
 *
 * That one element matters. Building a fresh Audio per track looks tidier and
 * does not work: a new element has to win autoplay permission of its own, and
 * a swap happens long after the click that allowed the first one, so it stalls
 * silently — play() never settles and nothing is heard. An element that has
 * already played keeps its permission through a src change.
 */
export function MusicProvider({ children }) {
  const enabled = useSelector(selectMusicEnabled)
  const screen = useSelector(selectScreen)
  const trackUrl = trackFor(screen)

  const audioRef = useRef(null)
  const loadedRef = useRef(null)

  // Create the element once, for the life of the app.
  useEffect(() => {
    const audio = new Audio()
    audio.loop = true
    audio.volume = 0.4
    audio.preload = 'auto'
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
      loadedRef.current = null
    }
  }, [])

  // Point it at the current screen's track. Guarded, because assigning the same
  // src again would start it over.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !trackUrl || loadedRef.current === trackUrl) return
    loadedRef.current = trackUrl
    audio.src = trackUrl
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
