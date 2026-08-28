import { useDispatch, useSelector } from 'react-redux'
import { requestMusic, selectMusicPlaying, setMusicEnabled } from '../store/uiSlice'
import { HAS_MUSIC } from './track'

/**
 * Music on/off. Renders nothing when there is no track to play.
 * Positioned by the screen that uses it.
 *
 * It draws itself from whether music is actually sounding, not from whether it
 * has been asked for. Browsers refuse audio until the page has been interacted
 * with, so a run can want music and have none — and a speaker drawn on while
 * the room is silent sends the player to press it, which under a plain toggle
 * would ask for the silence they already have.
 *
 * So the press says what it looks like it says: silent means start, sounding
 * means stop. Starting counts as a fresh ask even when music was already
 * wanted, so the press is always another go rather than a no-op — and the click
 * is itself the interaction the browser was holding out for.
 */
export default function MusicToggle({ className = '' }) {
  const playing = useSelector(selectMusicPlaying)
  const dispatch = useDispatch()
  if (!HAS_MUSIC) return null

  return (
    <button
      type="button"
      onClick={() => dispatch(playing ? setMusicEnabled(false) : requestMusic())}
      aria-pressed={playing}
      aria-label={playing ? 'Turn music off' : 'Turn music on'}
      title={playing ? 'Music on' : 'Music off'}
      className={[
        'group inline-flex cursor-pointer items-center justify-center',
        'border border-gold-500/35 bg-soot-950/60 p-2.5 text-gold-300/70 backdrop-blur-sm',
        'transition-colors duration-150 outline-none',
        'hover:border-gold-500/70 hover:text-gold-200',
        'focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-soot-950',
        className,
      ].join(' ')}
    >
      {playing ? <SpeakerOn /> : <SpeakerOff />}
    </button>
  )
}

function SpeakerOn() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

function SpeakerOff() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 6" />
      <path d="m21 9-5 6" />
    </svg>
  )
}
