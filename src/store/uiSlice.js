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

  /** Whether the player wants music. Remembered between visits. */
  musicEnabled: readMusicPref(),

  /**
   * Whether music is actually coming out, which is not the same thing.
   *
   * Browsers refuse to start audio before the page has been interacted with, so
   * a run can want music and have none. The toggle draws itself from this
   * rather than from the wanting, because a speaker icon claiming sound where
   * there is none is a lie the player has no way to see through.
   *
   * Not remembered: it describes this moment, not a preference.
   */
  musicPlaying: false,

  /**
   * How many times music has been asked for.
   *
   * Wanting music and having it are separate, so asking for it again when it is
   * already wanted has to count as an event or the press does nothing. The
   * provider watches this, and every bump is another go at starting.
   */
  musicRequest: 0,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    goTo: (s, { payload }) => {
      s.screen = payload
    },
    setMusicEnabled: (s, { payload }) => {
      s.musicEnabled = payload
    },
    /** Reported by the audio element itself, never guessed at. */
    setMusicPlaying: (s, { payload }) => {
      s.musicPlaying = payload
    },
    /** Asks for music, and counts as a fresh ask even if it was already wanted. */
    requestMusic: (s) => {
      s.musicEnabled = true
      s.musicRequest += 1
    },
  },
})

export const { goTo, setMusicEnabled, setMusicPlaying, requestMusic } = uiSlice.actions
export default uiSlice.reducer

export const selectScreen = (state) => state.ui.screen
export const selectMusicEnabled = (state) => state.ui.musicEnabled
export const selectMusicPlaying = (state) => state.ui.musicPlaying
export const selectMusicRequest = (state) => state.ui.musicRequest

export { MUSIC_PREF_KEY }
