// Game art is imported as a module so Vite fingerprints and bundles it.
// (`public/` is reserved for genuinely static files like the favicon.)

import homeBackground from '../../assets/exec-0c1c887b-3a09-41b0-875c-d9c48cc39ccb.png'
import characterCreationBackground from '../../assets/backgrounds/character-creation-background.png'
import atriumBackground from '../../assets/backgrounds/atrium-background.png'
import treehouseBackground from '../../assets/backgrounds/treehouse-background.png'
import castleIcon from '../../assets/icons/castle.svg'

export const HOME_BACKGROUND = homeBackground
export const CHARACTER_CREATION_BACKGROUND = characterCreationBackground
export const PET_CREATION_BACKGROUND = atriumBackground
export const CARD_SELECTION_BACKGROUND = treehouseBackground

/** Interface icons — named here rather than globbed, since code names them. */
export const CASTLE_ICON = castleIcon

/**
 * Art keys ignore the difference between `-` and `_`.
 *
 * Ids in the data use underscores (`golden_retriever`, `half_orc`) while some
 * art files use hyphens (`golden-retriever.png`). Normalising both sides means
 * either spelling resolves, so a filename never has to match an id exactly.
 */
const artKey = (s) => s.toLowerCase().replace(/_/g, '-')

const urlOf = (glob) =>
  Object.fromEntries(
    Object.entries(glob).map(([path, url]) => [
      artKey(path.split('/').pop().replace(/\.png$/, '')),
      url,
    ]),
  )

/**
 * Base (classless) figures — `assets/characters/{race}-{gender}.png`.
 * Shown until a class is chosen.
 */
export const CHARACTER_ART = urlOf(
  import.meta.glob('../../assets/characters/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

/**
 * Class figures — `assets/{class}s/{class}-{race}-{gender}-{pose}.png`,
 * e.g. `assets/fighters/fighter-human-female-rest.png`.
 *
 * Globbed one level deep so adding a `wizards/`, `rogues/` or `duelists/`
 * folder works with no code change, as long as the filename starts with the
 * class id. Keys keep the pose suffix: `fighter-human-female-rest`.
 *
 * Poses are listed rather than wildcarded — `*.png` one level deep would sweep
 * in cards, pets and backgrounds too.
 */
export const CLASS_ART = urlOf(
  import.meta.glob('../../assets/*/*-{rest,ready,sword}.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

/**
 * Pet figures — `assets/pets/{id}.png`, e.g. `assets/pets/golden_retriever.png`.
 * The id matches `pets[].id` in data/character-options.json.
 */
export const PET_ART = urlOf(
  import.meta.glob('../../assets/pets/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

/**
 * Art for a pet breed, or null when none has been drawn yet.
 *
 * Scale comes from the pet's TYPE (cats are much smaller than dogs), unless a
 * specific breed has its own entry in ART_SCALE.
 */
export function resolvePetArt(petId, petType) {
  if (!petId) return null
  const key = artKey(petId)
  if (!PET_ART[key]) return null
  const scale = ART_SCALE[key] ?? PET_TYPE_SCALE[petType] ?? PET_TYPE_SCALE.dog
  return { url: PET_ART[key], scale, key }
}

/**
 * Per-figure display scale, keyed by art key.
 *
 * Source images are framed inconsistently — some have more transparent margin
 * baked in than others — so this evens them out at render time rather than
 * re-cutting the files. 1 = full available height. Anything not listed is 1.
 */
const ART_SCALE = {
  'human-female': 0.92,
  'human-nonbinary': 0.95,
}

/**
 * Pets render smaller than people — they are animals on the same floor, not
 * full-height portraits — and cats are smaller again than dogs.
 * Override an individual breed by adding it to ART_SCALE.
 */
const PET_TYPE_SCALE = {
  dog: 0.55,
  cat: 0.3,
}

/**
 * The figure to draw for the current selection.
 *
 * Class art wins when it exists; otherwise the base race+gender figure; and
 * null when neither has been drawn yet (the screen shows a placeholder).
 *
 * @returns {{ url: string, scale: number, key: string, isClassArt: boolean } | null}
 */
export function resolveCharacterArt({ race, gender, classId = null, pose = 'rest' }) {
  if (classId) {
    const key = artKey(`${classId}-${race}-${gender}-${pose}`)
    if (CLASS_ART[key]) {
      return { url: CLASS_ART[key], scale: ART_SCALE[key] ?? 1, key, isClassArt: true }
    }
  }

  const key = artKey(`${race}-${gender}`)
  if (CHARACTER_ART[key]) {
    return { url: CHARACTER_ART[key], scale: ART_SCALE[key] ?? 1, key, isClassArt: false }
  }

  return null
}

/**
 * Card art — `assets/cards/{filename}`, taken from the card's `image` field in
 * cards.json. No art exists yet; the glob simply resolves to nothing and cards
 * draw a placeholder frame until the files land.
 */
export const CARD_ART = urlOf(
  import.meta.glob('../../assets/cards/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

/** Art for a card, or null when none has been drawn yet. */
export function resolveCardArt(card) {
  const filename = card.image?.filename
  if (!filename) return null
  return CARD_ART[artKey(filename.replace(/\.png$/, ''))] ?? null
}

/**
 * Room backgrounds — `assets/backgrounds/{filename}`, taken from the room's
 * `background` field in rooms.json. Same filename lookup as card and pet art.
 *
 * The four creation-screen backgrounds above are imported by name because the
 * screens name them directly; rooms name theirs in data, so they resolve here.
 */
export const BACKGROUND_ART = urlOf(
  import.meta.glob('../../assets/backgrounds/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

/** The backdrop for a room, or null when the file named in data is missing. */
export function resolveRoomBackground(room) {
  const filename = room?.background?.filename
  if (!filename) return null
  return BACKGROUND_ART[artKey(filename.replace(/\.png$/, ''))] ?? null
}

/**
 * Idle animation sheets — `assets/{class}s/{class}-{race}-{gender}-{pose}-idle-spritesheet.png`,
 * each with a sibling `.json` naming its frame size, count and rate.
 *
 * Only some figures have one. A figure without a sheet falls back to its still
 * art, so animating a new one is a matter of dropping two files in.
 */
const IDLE_SHEETS = urlOf(
  import.meta.glob('../../assets/*/*-idle-spritesheet.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

const IDLE_SHEET_META = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/*/*-idle-spritesheet.json', {
      eager: true,
      import: 'default',
    }),
  ).map(([path, meta]) => [artKey(path.split('/').pop().replace(/\.json$/, '')), meta]),
)

/**
 * The looping idle sheet filed under a name, or null where none has been drawn.
 *
 * Enemies are named directly — `skeleton-swordsman`; player figures compose
 * theirs from class, race, gender and pose. Both live under the same glob, so
 * one lookup serves both sides.
 *
 * @returns {{ url: string, meta: object, key: string } | null}
 */
export function idleSpriteNamed(name) {
  const key = artKey(`${name}-idle-spritesheet`)
  const url = IDLE_SHEETS[key]
  const meta = IDLE_SHEET_META[key]
  return url && meta ? { url, meta, key } : null
}

/** The looping idle sheet for a player figure, or null. */
export function resolveIdleSprite({ race, gender, classId, pose = 'ready' }) {
  if (!classId) return null
  return idleSpriteNamed(`${classId}-${race}-${gender}-${pose}`)
}

/**
 * Route maps — `assets/maps/{filename}`, each with a sibling `.json` naming
 * where its nodes sit as fractions of the image. The circles and the dotted
 * line between them are painted into the art; the coordinates exist so the
 * screen can put something on top of each one.
 */
const MAP_ART = urlOf(
  import.meta.glob('../../assets/maps/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

const MAP_META = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/maps/*.json', { eager: true, import: 'default' }),
  ).map(([path, meta]) => [artKey(path.split('/').pop().replace(/\.json$/, '')), meta]),
)

/**
 * Icons that sit on the map's circles — `assets/maps/{filename}.svg`.
 *
 * Keyed by the whole filename, extension included, rather than through urlOf:
 * that helper only strips `.png`, so an svg would key as `wilbur.svg` and a
 * lookup for `wilbur` would quietly miss.
 */
const MAP_ICONS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/maps/*.svg', {
      eager: true,
      query: '?url',
      import: 'default',
    }),
  ).map(([path, url]) => [artKey(path.split('/').pop()), url]),
)

/** A room's map icon, or null where it has none or the file is missing. */
export function resolveRoomIcon(icon) {
  const filename = icon?.filename
  if (!filename) return null
  return MAP_ICONS[artKey(filename)] ?? null
}

/**
 * The route map named in data, or null when either half is missing.
 *
 * @returns {{ url: string, meta: object } | null}
 */
export function resolveMap(map) {
  const filename = map?.filename
  if (!filename) return null
  const key = artKey(filename.replace(/\.png$/, ''))
  const url = MAP_ART[key]
  const meta = MAP_META[key]
  return url && meta ? { url, meta } : null
}
