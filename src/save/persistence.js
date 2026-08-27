import { loadSave, writeSave } from './storage'

/**
 * Keeping the game across a reload.
 *
 * The character, the pet, the loadout and how far the run has got are all
 * written to localStorage as they change, and read back before the first render
 * so the player lands where they left off rather than at the welcome screen.
 *
 * A reload always lands on the welcome screen, whatever the player was doing.
 * Continuing is a choice they make there, not something a refresh does for them
 * — and it is the only place New Game is offered, so a reload must pass through
 * it rather than around it.
 *
 * Continue then goes where the mode says: the map for a run underway, at the
 * point reached, or back to the exact screen a half-built character was left on.
 * Never back into a room — ARCHITECTURE.md §4 has the save point as the map
 * precisely so combat state never has to be serialised.
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
 * Where the Continue button lands: the map once the run is underway, otherwise
 * wherever they left off.
 *
 * Falls back to the welcome screen for anything unrecognised, so a save written
 * by a future version cannot drop the player onto a screen this one lacks.
 */
export function screenToContinue(save) {
  if (!save) return 'home'
  if (save.character?.mode === 'battle') return 'map'
  return RESUMABLE.has(save.screen) ? save.screen : 'home'
}

/**
 * The saved character, for the store to start from.
 *
 * No screen comes back with it: a reload lands on the welcome screen, which is
 * where the store starts anyway. Hydrating regardless keeps the store and the
 * save saying the same thing, so a write from anywhere cannot quietly replace a
 * real game with an empty one.
 *
 * @returns {Promise<object | null>} null when there is nothing to resume, or
 * when the save failed its checksum — a save that does not verify is refused
 * rather than partly applied.
 */
export async function readSavedCharacter() {
  const result = await loadSave()
  return result.status === 'valid' && result.data?.character ? result.data.character : null
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
