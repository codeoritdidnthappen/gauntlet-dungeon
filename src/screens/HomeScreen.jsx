import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { HOME_BACKGROUND } from '../config/assets'
import { clearSave, loadSave } from '../save/storage'
import { screenToContinue } from '../save/persistence'
import MusicToggle from '../audio/MusicToggle'
import { goTo } from '../store/uiSlice'
import { hydratePlayer, resetPlayer } from '../store/playerSlice'

/**
 * Screen 1 — Welcome.
 *
 * Background art (the title is baked into the image, so no text title here),
 * New Game always, Continue only when a valid save passes the checksum, and
 * the localStorage warning.
 */
export default function HomeScreen() {
  const dispatch = useDispatch()
  // Local: only this screen cares whether the save check has finished.
  // 'checking' | 'none' | 'valid' | 'invalid'
  const [status, setStatus] = useState('checking')
  const [save, setSave] = useState(null)

  const newGame = () => {
    // Destroy the old game outright rather than leaving the autosave to
    // overwrite it. Only one game is stored at a time, and the write is
    // debounced — reload inside that window and the old game comes back.
    clearSave()
    setStatus('none')
    setSave(null)
    dispatch(resetPlayer())
    dispatch(goTo('creation'))
  }

  const continueGame = () => {
    if (save?.character) dispatch(hydratePlayer(save.character))
    // The map once the run is underway, otherwise wherever they left off. A
    // reload lands here instead, which is what makes this button reachable.
    dispatch(goTo(screenToContinue(save)))
  }

  useEffect(() => {
    let cancelled = false
    loadSave().then((result) => {
      if (cancelled) return
      setStatus(result.status)
      setSave(result.data ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="relative h-full w-full overflow-hidden bg-soot-950">
      {/* Background art */}
      {/* The title is baked into the art at the top-left, so bias the crop left —
          object-cover from centre eats the "G" on anything narrower than 16:9. */}
      <img
        src={HOME_BACKGROUND}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-left"
      />

      {/* Vignette + torch wash, so buttons stay legible over the art */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 40%, transparent 30%, rgba(10,8,5,0.55) 72%, rgba(10,8,5,0.92) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="torch-flicker pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          background:
            'radial-gradient(60% 50% at 30% 55%, rgba(217,182,75,0.30), transparent 70%)',
        }}
      />

      <MusicToggle className="absolute top-6 right-6 z-10" />

      {/* Content */}
      <div className="relative flex h-full w-full flex-col justify-end p-8 sm:p-12 lg:p-16">
        <div className="fade-up flex max-w-xs flex-col gap-4">
          {status === 'valid' && (
            <MenuButton primary onClick={continueGame}>
              Continue
              <SaveSummary save={save} />
            </MenuButton>
          )}

          <MenuButton primary={status !== 'valid'} onClick={newGame}>
            New Game
          </MenuButton>

          {status === 'invalid' && (
            <p className="text-sm leading-snug text-ember-600">
              A saved game was found but could not be read. It may have been edited or
              corrupted, so it cannot be continued.
            </p>
          )}
        </div>

        <p className="fade-up mt-8 max-w-md text-xs leading-relaxed text-gold-200/45">
          Your progress is stored in this browser only. Clearing your browser data will
          permanently delete your game.
        </p>
      </div>
    </main>
  )
}

function SaveSummary({ save }) {
  if (!save?.character?.name) return null
  const { name, role } = save.character
  return (
    <span className="mt-1 block font-body text-xs normal-case tracking-normal text-gold-200/60">
      {name}
      {role ? ` — ${role}` : ''}
    </span>
  )
}

function MenuButton({ children, onClick, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full cursor-pointer border px-6 py-4 text-left font-display text-lg font-bold uppercase tracking-[0.15em]',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-soot-950',
        primary
          ? 'border-gold-500/70 bg-soot-900/80 text-gold-300 hover:border-gold-400 hover:bg-soot-800/90 hover:text-gold-200'
          : 'border-gold-500/30 bg-soot-950/70 text-gold-300/80 hover:border-gold-500/60 hover:text-gold-200',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
