// Game art is imported as a module so Vite fingerprints and bundles it.
// (`public/` is reserved for genuinely static files like the favicon.)

import homeBackground from '../../assets/exec-0c1c887b-3a09-41b0-875c-d9c48cc39ccb.png'
import characterCreationBackground from '../../assets/backgrounds/character-creation-background.png'
import atriumBackground from '../../assets/backgrounds/atrium-background.png'
import treehouseBackground from '../../assets/backgrounds/treehouse-background.png'

export const HOME_BACKGROUND = homeBackground
export const CHARACTER_CREATION_BACKGROUND = characterCreationBackground
export const PET_CREATION_BACKGROUND = atriumBackground
export const CARD_SELECTION_BACKGROUND = treehouseBackground

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
 */
export const CLASS_ART = urlOf(
  import.meta.glob('../../assets/*/*-rest.png', {
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
