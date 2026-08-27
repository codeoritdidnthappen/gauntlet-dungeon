import { loadSave, writeSave } from './storage'

/**
 * Keeping the game across a reload.
 *
 * The character, the pet, the loadout and how far the run has got are all
 * written to localStorage as they change, and read back before the first render
 * so the player lands where they left off rather than at the welcome screen.
 *
 * Where they land depends on whether the run is underway:
 *
 *   - **not started** — back on the screen they were on. Creation, pet and
 *     loadout are all still theirs to change.
 *   - **started** — the map, at the point they had reached. Never back into a
 *     room: ARCHITECTURE.md §4 has the save point as the map precisely so combat
 *     state never has to be serialised, and a resumed run never restores
 *     mid-encounter.
 */

/** Screens a reload may land on. `room` is deliberately absent. */
const RESUMABLE = new Set(['home', 'creation', 'pet', 'cards', 'map'])

/** How long to sit on changes before writing. Creation fires a lot of them. */
const WRITE_DELAY_MS = 400

/** What gets written. `character` is the key the welcome screen already reads. */
export function snapshotOf(state) {
  return { character: state.player, screen: state.ui.screen }
}

/**
 * The screen a save should resume on.
 *
 * Falls back to the welcome screen for anything unrecognised, so a save written
 * by a future version cannot drop the player onto a screen this one lacks.
 */
export function screenToRestore(save) {
  if (!save) return 'home'
  if (save.character?.mode === 'battle') return 'map'
  return RESUMABLE.has(save.screen) ? save.screen : 'home'
}

/**
 * Read the save and say what to do with it.
 *
 * @returns {Promise<{ character: object, screen: string } | null>} null when
 * there is nothing to resume, or when the save failed its checksum — a save
 * that does not verify is refused rather than partly applied.
 */
export async function readResumePoint() {
  const result = await loadSave()
  if (result.status !== 'valid' || !result.data?.character) return null
  return { character: result.data.character, screen: screenToRestore(result.data) }
}

/**
 * Write the game whenever it changes, from now on.
 *
 * Debounced, because a single keystroke in the name field is a state change and
 * every write costs an HMAC. Writes are fire-and-forget: a failure means the
 * browser is refusing storage, which the welcome screen already warns about and
 * which nothing here can fix.
 */
export function startAutosave(store) {
  let timer = null
  let last = snapshotOf(store.getState())

  return store.subscribe(() => {
    const next = snapshotOf(store.getState())
    if (next.character === last.character && next.screen === last.screen) return
    last = next

    clearTimeout(timer)
    timer = setTimeout(() => writeSave(next), WRITE_DELAY_MS)
  })
}
