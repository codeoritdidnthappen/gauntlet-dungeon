import { createSlice } from '@reduxjs/toolkit'

/**
 * Cross-screen UI state.
 *
 * `screen` is here because every screen navigates, so routing can't live in
 * one component's state. `musicEnabled` is here because the toggle is rendered
 * on several screens while the audio element lives in one provider.
 *
 * The <audio> element itself stays out of Redux — it is an imperative,
 * non-serialisable resource. Only the on/off flag is state.
 */

const MUSIC_PREF_KEY = 'gauntlet.music'

function readMusicPref() {
  try {
    return localStorage.getItem(MUSIC_PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

const initialState = {
  screen: 'home',
  musicEnabled: readMusicPref(),
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    goTo: (s, { payload }) => {
      s.screen = payload
    },
    toggleMusic: (s) => {
      s.musicEnabled = !s.musicEnabled
    },
    setMusicEnabled: (s, { payload }) => {
      s.musicEnabled = payload
    },
  },
})

export const { goTo, toggleMusic, setMusicEnabled } = uiSlice.actions
export default uiSlice.reducer

export const selectScreen = (state) => state.ui.screen
export const selectMusicEnabled = (state) => state.ui.musicEnabled

export { MUSIC_PREF_KEY }
