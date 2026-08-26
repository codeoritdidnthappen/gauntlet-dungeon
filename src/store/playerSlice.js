import { createSlice } from '@reduxjs/toolkit'
import cardData from '../../data/cards.json'
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

/** Per-class combat stats — maxHealth, maxEnergy, startingBlock. */
const CLASS_STATS = Object.fromEntries(options.classes.map((c) => [c.id, c.stats]))

/**
 * The fixed starting loadout (D15, revised) — 3 attack, 1 defend, 1 power.
 *
 * The player does not build it; every run starts with the same five neutral
 * cards whatever the class. Composition lives in cards.json so content and code
 * stay editable apart.
 */
export const STARTING_LOADOUT = cardData.notes.startingLoadout

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

  // combat stats — all four classes share maxEnergy 3; only maxHealth and
  // startingBlock differ. Zero until a role is chosen, because the class is
  // what supplies them (SCHEMA.md §14).
  maxHealth: 0,
  health: 0,
  maxEnergy: 0,
  energy: 0,
  /** The value block is reset TO each turn — 0 for everyone but the Fighter. */
  startingBlock: 0,
  block: 0,

  // loadout — flat list of card ids, duplicates repeated (D15). Granted, not
  // chosen: a new character already has their five cards.
  loadout: [...STARTING_LOADOUT],
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
    /**
     * Sets the role, derives the class from it, and takes that class's combat
     * stats. Changing role mid-creation re-rolls the stats to full, which is
     * correct — creation is not a run.
     */
    setRole: (s, { payload }) => {
      s.role = payload
      s.class = ROLE_TO_CLASS[payload] ?? null

      const stats = CLASS_STATS[s.class]
      s.maxHealth = stats?.maxHealth ?? 0
      s.health = s.maxHealth
      s.maxEnergy = stats?.maxEnergy ?? 0
      s.energy = s.maxEnergy
      s.startingBlock = stats?.startingBlock ?? 0
      s.block = s.startingBlock
    },
    /** Picks a pet; the type comes along so nothing has to look it up later. */
    setPet: (s, { payload }) => {
      s.pet = payload.id
      s.petType = payload.type
    },
    setPetName: (s, { payload }) => {
      s.petName = payload
    },

    /**
     * Start of the player's turn: energy refills to full and does not carry
     * over, and block drops back to the class default rather than to zero
     * (SCHEMA.md §7, §8). For everyone but the Fighter that default is 0, so
     * this is the standard Spire rule with one class-shaped exception.
     */
    startTurn: (s) => {
      s.energy = s.maxEnergy
      s.block = s.startingBlock
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
    /** Back to the granted five — used on restart and by New Game. */
    resetLoadout: (s) => {
      s.loadout = [...STARTING_LOADOUT]
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
  startTurn,
  addCard,
  removeCard,
  clearLoadout,
  resetLoadout,
  hydratePlayer,
  resetPlayer,
} = playerSlice.actions

export default playerSlice.reducer

/* -------------------------------------------------------------- selectors */

export const selectPlayer = (state) => state.player
export const selectClassId = (state) => state.player.class
export const selectLoadout = (state) => state.player.loadout

/** Combat stats as one object, for anything that shows or resolves them. */
export const selectStats = (state) => ({
  health: state.player.health,
  maxHealth: state.player.maxHealth,
  energy: state.player.energy,
  maxEnergy: state.player.maxEnergy,
  block: state.player.block,
  startingBlock: state.player.startingBlock,
})

/** Display name, falling back to the placeholder the UI shows. */
export const selectDisplayName = (state) => state.player.name.trim() || 'Unnamed'
export const selectPetDisplayName = (state) => state.player.petName.trim()
