import { createContext, useContext, useEffect, useRef, useState } from 'react'

/**
 * Background music.
 *
 * One <audio> element lives here at the app root, so navigating between screens
 * never restarts the track. Screens just render <MusicToggle />.
 *
 * Whatever .mp3 sits in /audio is picked up automatically — drop a different
 * file in and it is used with no code change.
 */
const tracks = import.meta.glob('../../audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})

const TRACK_URL = Object.values(tracks)[0] ?? null

const PREF_KEY = 'gauntlet.music'

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

function writePref(on) {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off')
  } catch {
    /* private mode — just don't persist */
  }
}

const MusicContext = createContext({
  enabled: true,
  playing: false,
  available: false,
  toggle: () => {},
})

export const useMusic = () => useContext(MusicContext)

export function MusicProvider({ children }) {
  const audioRef = useRef(null)
  // Music is ON by default; a previous "off" choice is remembered.
  const [enabled, setEnabled] = useState(readPref)
  const [playing, setPlaying] = useState(false)

  // Create the element once.
  useEffect(() => {
    if (!TRACK_URL) return
    const audio = new Audio(TRACK_URL)
    audio.loop = true
    audio.volume = 0.4
    audio.preload = 'auto'
    audioRef.current = audio

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.pause()
      audioRef.current = null
    }
  }, [])

  // Follow the enabled flag. Browsers block autoplay until the page has been
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
        if (readPref()) audio.play().catch(() => {})
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

  const toggle = () => {
    setEnabled((on) => {
      const next = !on
      writePref(next)
      return next
    })
  }

  return (
    <MusicContext.Provider
      value={{ enabled, playing, available: Boolean(TRACK_URL), toggle }}
    >
      {children}
    </MusicContext.Provider>
  )
}
