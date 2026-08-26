import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import options from '../../data/character-options.json'
import { CHARACTER_CREATION_BACKGROUND, resolveCharacterArt } from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import { goTo } from '../store/uiSlice'
import { selectPlayer, setGender, setName, setRace, setRole } from '../store/playerSlice'
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
 * Screen 2 — Character creation.
 *
 * Character centred, gender + race on the left, class on the right.
 * Defaults to human female (set in the player slice).
 *
 * Every choice is dispatched straight to Redux rather than held locally, so
 * navigating away and back keeps the character intact.
 *
 * Note on the right-hand panel: the player actually picks a ROLE, which
 * resolves to a class (D10). Roles are therefore grouped under their class
 * heading, so the control reads as "class" while still recording the role —
 * nothing in resolution may branch on role, only on class.
 */
export default function CharacterCreation() {
  const dispatch = useDispatch()
  const { name, race, gender, role, class: classId } = useSelector(selectPlayer)

  const selectedClass = options.classes.find((c) => c.id === classId)

  // Class art once a class is chosen; the plain race+gender figure until then.
  const art = resolveCharacterArt({ race, gender, classId })

  // Roles grouped under the class they resolve to.
  const classGroups = useMemo(
    () =>
      options.classes.map((cls) => ({
        ...cls,
        roles: options.roles.filter((r) => r.class === cls.id),
      })),
    [],
  )

  return (
    <main className="relative h-full w-full overflow-hidden bg-soot-950">
      <ScreenBackdrop src={CHARACTER_CREATION_BACKGROUND} />

      <MusicToggle className="absolute top-6 right-6 z-20" />

      <div className="relative flex h-full w-full items-stretch gap-4 p-5 lg:gap-8 lg:p-8">
        {/* ---------------------------------------------------- left: identity */}
        <Panel title="Character" className="w-64 shrink-0 self-center lg:w-72">
          <Field label="Name">
            <TextInput
              value={name}
              onChange={(v) => dispatch(setName(v))}
              maxLength={options.limits.nameMaxLength}
              placeholder="Unnamed"
            />
          </Field>

          <Field label="Gender">
            <ButtonRow
              items={options.genders}
              value={gender}
              onChange={(v) => dispatch(setGender(v))}
            />
          </Field>

          <Field label="Race">
            <ButtonRow
              items={options.races}
              value={race}
              onChange={(v) => dispatch(setRace(v))}
            />
          </Field>
        </Panel>

        {/* --------------------------------------------------- centre: figure */}
        <div className="relative flex min-w-0 flex-1 items-end justify-center">
          {art ? (
            <img
              key={art.key}
              src={art.url}
              alt=""
              // Scaled from the bottom, so the feet stay planted on the floor
              // whatever the figure's height.
              style={{ maxHeight: `${art.scale * 100}%` }}
              className="w-auto object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
            />
          ) : (
            <MissingArt path={`assets/characters/${race}-${gender}.png`} />
          )}
        </div>

        {/* ------------------------------------------------------ right: class */}
        <Panel title="Class" className="flex w-72 shrink-0 flex-col self-center lg:w-80">
          <div className="flex flex-col gap-3">
            {classGroups.map((cls) => (
              <div key={cls.id}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span
                    className={[
                      'font-display text-xs font-bold uppercase tracking-[0.18em]',
                      cls.id === classId ? 'text-gold-300' : 'text-gold-200/40',
                    ].join(' ')}
                  >
                    {cls.name}
                  </span>
                  <span className="font-body text-[11px] text-gold-200/30">
                    {cls.stats.maxHealth} HP
                  </span>
                </div>
                <ButtonRow
                  items={cls.roles}
                  value={role}
                  onChange={(v) => dispatch(setRole(v))}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-gold-500/20 pt-3">
            {selectedClass ? (
              <>
                <div className="flex gap-4 font-body text-xs text-gold-200/70">
                  <span>
                    <span className="text-gold-200/40">Health</span>{' '}
                    {selectedClass.stats.maxHealth}
                  </span>
                  <span>
                    <span className="text-gold-200/40">Energy</span>{' '}
                    {selectedClass.stats.maxEnergy}
                  </span>
                </div>
                <p className="mt-2 font-body text-xs leading-relaxed text-gold-200/45">
                  {selectedClass.shape}
                </p>
              </>
            ) : (
              <p className="font-body text-xs leading-relaxed text-gold-200/40">
                Choose a class to continue.
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* ------------------------------------------------------------ actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-3 p-5 lg:p-8">
        <ActionButton onClick={() => dispatch(goTo('home'))}>Back</ActionButton>
        <ActionButton primary disabled={!classId} onClick={() => dispatch(goTo('pet'))}>
          Proceed
        </ActionButton>
      </div>
    </main>
  )
}
