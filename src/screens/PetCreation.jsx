import { useMemo, useState } from 'react'
import options from '../../data/character-options.json'
import { PET_CREATION_BACKGROUND, resolvePetArt } from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import {
  ActionButton,
  ButtonRow,
  Field,
  MissingArt,
  Panel,
  ScreenBackdrop,
  TextInput,
} from '../components/ui'

/**
 * Screen 3 — Pet.
 *
 * Same layout as character creation: pet centred, everything else in a
 * semi-transparent panel on the left. Breeds are grouped under their type,
 * mirroring how roles are grouped under classes on Screen 2.
 *
 * Nothing is selected by default, matching the class control.
 */
/** Dogs are loyal. Cats are present. */
function blurbFor(petType, petName) {
  // Before naming, fall back to "Your dog" / "Your cat" — using the word
  // "companion" here would collide with the dog line's own ending.
  const name = petName.trim() || (petType === 'cat' ? 'Your cat' : 'Your dog')
  return petType === 'cat'
    ? `${name} is your faith- ... well, they tolerate you.`
    : `${name} is your faithful companion.`
}

export default function PetCreation({ onBack, onConfirm }) {
  const [petName, setPetName] = useState('')
  const [pet, setPet] = useState(null)

  const selectedPet = options.pets.find((p) => p.id === pet)
  const art = resolvePetArt(pet, selectedPet?.type)

  const typeGroups = useMemo(
    () =>
      options.petTypes.map((type) => ({
        ...type,
        pets: options.pets.filter((p) => p.type === type.id),
      })),
    [],
  )

  return (
    <main className="relative h-full w-full overflow-hidden bg-soot-950">
      <ScreenBackdrop src={PET_CREATION_BACKGROUND} />

      <MusicToggle className="absolute top-6 right-6 z-20" />

      <div className="relative flex h-full w-full items-stretch gap-4 p-5 lg:gap-8 lg:p-8">
        {/* ------------------------------------------------------------ left */}
        <Panel title="Companion" className="w-64 shrink-0 self-center lg:w-72">
          <Field label="Name">
            <TextInput
              value={petName}
              onChange={setPetName}
              maxLength={options.limits.petNameMaxLength}
              placeholder="Unnamed"
            />
          </Field>

          {typeGroups.map((type) => (
            <Field key={type.id} label={type.name}>
              <ButtonRow items={type.pets} value={pet} onChange={setPet} />
            </Field>
          ))}

          <div className="mt-4 border-t border-gold-500/20 pt-3">
            <p className="font-body text-xs leading-relaxed text-gold-200/45">
              {selectedPet ? blurbFor(selectedPet.type, petName) : 'Choose a companion to continue.'}
            </p>
          </div>
        </Panel>

        {/* ---------------------------------------------------------- centre */}
        <div className="relative flex min-w-0 flex-1 items-end justify-center">
          {art ? (
            <img
              key={art.key}
              src={art.url}
              alt=""
              // Pets are wide rather than tall, so cap width too or a
              // landscape image overflows the centre column.
              style={{ maxHeight: `${art.scale * 100}%` }}
              className="max-w-full w-auto object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
            />
          ) : (
            <MissingArt path={selectedPet ? `assets/pets/${pet.replace(/_/g, '-')}.png` : 'assets/pets/'} />
          )}
        </div>

        {/* Balances the left panel so the pet stays centred in the frame. */}
        <div className="hidden w-64 shrink-0 lg:block lg:w-72" aria-hidden="true" />
      </div>

      {/* --------------------------------------------------------- actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-3 p-5 lg:p-8">
        <ActionButton onClick={onBack}>Back</ActionButton>
        <ActionButton
          primary
          disabled={!selectedPet}
          onClick={() =>
            onConfirm?.({
              petType: selectedPet.type,
              pet: selectedPet.id,
              petName: petName.trim() || 'Unnamed',
            })
          }
        >
          Proceed
        </ActionButton>
      </div>
    </main>
  )
}
