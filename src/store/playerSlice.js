import { createSlice } from '@reduxjs/toolkit'
import options from '../../data/character-options.json'

/**
 * The player character — built across Screens 2, 3 and 4 and carried for the
 * whole run. Everything here outlives the screen that set it, so it lives in
 * Redux rather than component state.
 *
 * Shape matches SCHEMA.md §9 (PlayerCharacter).
 */

/** Roles resolve to a class (D10). Class is derived, never set on its own. */
const ROLE_TO_CLASS = Object.fromEntries(options.roles.map((r) => [r.id, r.class]))

const initialState = {
  // identity
  name: '',
  race: 'human',
  gender: 'female',
  role: null,
  class: null,

  // pet (D13)
  petType: null,
  pet: null,
  petName: '',

  // loadout — flat list of card ids, duplicates repeated (D15)
  loadout: [],
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setName: (s, { payload }) => {
      s.name = payload
    },
    setRace: (s, { payload }) => {
      s.race = payload
    },
    setGender: (s, { payload }) => {
      s.gender = payload
    },
    /** Sets the role and derives the class from it. */
    setRole: (s, { payload }) => {
      s.role = payload
      s.class = ROLE_TO_CLASS[payload] ?? null
    },
    /** Picks a pet; the type comes along so nothing has to look it up later. */
    setPet: (s, { payload }) => {
      s.pet = payload.id
      s.petType = payload.type
    },
    setPetName: (s, { payload }) => {
      s.petName = payload
    },

    addCard: (s, { payload }) => {
      s.loadout.push(payload)
    },
    /** Removes one copy, leaving any others in place. */
    removeCard: (s, { payload }) => {
      const i = s.loadout.indexOf(payload)
      if (i !== -1) s.loadout.splice(i, 1)
    },
    clearLoadout: (s) => {
      s.loadout = []
    },

    /** Replace the whole character — used when loading a save. */
    hydratePlayer: (_s, { payload }) => ({ ...initialState, ...payload }),
    resetPlayer: () => initialState,
  },
})

export const {
  setName,
  setRace,
  setGender,
  setRole,
  setPet,
  setPetName,
  addCard,
  removeCard,
  clearLoadout,
  hydratePlayer,
  resetPlayer,
} = playerSlice.actions

export default playerSlice.reducer

/* -------------------------------------------------------------- selectors */

export const selectPlayer = (state) => state.player
export const selectClassId = (state) => state.player.class
export const selectLoadout = (state) => state.player.loadout

/** Display name, falling back to the placeholder the UI shows. */
export const selectDisplayName = (state) => state.player.name.trim() || 'Unnamed'
export const selectPetDisplayName = (state) => state.player.petName.trim()
