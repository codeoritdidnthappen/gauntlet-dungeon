import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectMusicEnabled,
  selectMusicRequest,
  selectScreen,
  setMusicPlaying,
} from '../store/uiSlice'
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
  const dispatch = useDispatch()
  const enabled = useSelector(selectMusicEnabled)
  const request = useSelector(selectMusicRequest)
  const screen = useSelector(selectScreen)
  const trackUrl = trackFor(screen)

  const audioRef = useRef(null)
  const loadedRef = useRef(null)

  // Create the element once, for the life of the app.
  //
  // It reports whether it is sounding rather than being taken at its word: a
  // play() that was accepted can still be refused, and the toggle draws itself
  // from what actually happened.
  useEffect(() => {
    const audio = new Audio()
    audio.loop = true
    audio.volume = 0.4
    audio.preload = 'auto'
    audioRef.current = audio

    const sounding = () => dispatch(setMusicPlaying(true))
    const silent = () => dispatch(setMusicPlaying(false))
    audio.addEventListener('playing', sounding)
    audio.addEventListener('pause', silent)
    audio.addEventListener('ended', silent)
    audio.addEventListener('emptied', silent)

    return () => {
      audio.removeEventListener('playing', sounding)
      audio.removeEventListener('pause', silent)
      audio.removeEventListener('ended', silent)
      audio.removeEventListener('emptied', silent)
      audio.pause()
      audioRef.current = null
      loadedRef.current = null
      dispatch(setMusicPlaying(false))
    }
  }, [dispatch])

  // Point it at the current screen's track. Guarded, because assigning the same
  // src again would start it over.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !trackUrl || loadedRef.current === trackUrl) return
    loadedRef.current = trackUrl
    audio.src = trackUrl
  }, [trackUrl])

  // Follow the flag. Browsers block audio until the page has been interacted
  // with, so a refused play() waits for the next click or keypress and tries
  // again, and keeps trying until it is allowed or the player says stop.
  //
  // Everything here is tied to `live`. The refusal arrives a turn later than
  // the call, so without it a toggle-off between the two would leave listeners
  // armed that nothing removes — and those would start music that had just been
  // switched off, or race the pause and abort themselves.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    if (!enabled) {
      audio.pause()
      return undefined
    }

    let live = true

    // Declarations, not consts: the two refer to each other.
    function start() {
      if (!live) return
      audio.play().catch(arm)
    }

    function arm() {
      if (!live) return
      window.addEventListener('pointerdown', start, { once: true })
      window.addEventListener('keydown', start, { once: true })
    }

    audio.play().catch(arm)

    return () => {
      live = false
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [enabled, trackUrl, request])

  return children
}
