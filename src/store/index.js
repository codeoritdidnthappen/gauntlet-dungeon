import { configureStore } from '@reduxjs/toolkit'
import playerReducer from './playerSlice'
import uiReducer, { MUSIC_PREF_KEY } from './uiSlice'

export const store = configureStore({
  reducer: {
    player: playerReducer,
    ui: uiReducer,
  },
})

/**
 * Persist the music preference.
 *
 * Only this one flag is mirrored to localStorage — the run itself is saved
 * through src/save/storage.js, which is checksummed and versioned.
 */
let lastMusic = store.getState().ui.musicEnabled
store.subscribe(() => {
  const next = store.getState().ui.musicEnabled
  if (next === lastMusic) return
  lastMusic = next
  try {
    localStorage.setItem(MUSIC_PREF_KEY, next ? 'on' : 'off')
  } catch {
    /* private mode — just don't persist */
  }
})
