import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cardData from '../../data/cards.json'
import options from '../../data/character-options.json'
import { CARD_SELECTION_BACKGROUND, CASTLE_ICON } from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import GameCard from '../components/GameCard'
import { ActionButton, Panel, ScreenBackdrop } from '../components/ui'
import { goTo } from '../store/uiSlice'
import { selectClassId, selectDisplayName, selectLoadout } from '../store/playerSlice'

/**
 * Screen 4 — Starting loadout.
 *
 * The player no longer builds a deck (D15, revised). Everyone starts the run
 * with the same five cards — 3 attack, 1 defend, 1 power — and this screen
 * exists to show them what they are walking in with, not to let them choose.
 *
 * The five are laid out as a hand of physical cards: duplicates are drawn as
 * separate cards rather than collapsed to a count, because five cards on the
 * table is the point.
 *
 * Class cards are earned later, from post-room rewards, which is what makes the
 * class pools a progression rather than a menu.
 *
 * The loadout is read straight from Redux; the screen dispatches nothing except
 * navigation.
 */
const TYPE_ORDER = ['attack', 'defend', 'power']
const TYPE_LABEL = { attack: 'Attack', defend: 'Defend', power: 'Power' }

const CARD_BY_ID = Object.fromEntries(cardData.cards.map((c) => [c.id, c]))

export default function StartingLoadout() {
  const dispatch = useDispatch()
  const classId = useSelector(selectClassId) ?? 'fighter'
  const loadout = useSelector(selectLoadout)
  const playerName = useSelector(selectDisplayName)

  const className = options.classes.find((c) => c.id === classId)?.name ?? classId

  /** The five granted cards, in attack / defend / power order. */
  const hand = useMemo(
    () =>
      loadout
        .map((id) => CARD_BY_ID[id])
        .filter(Boolean)
        .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)),
    [loadout],
  )

  return (
    <main className="relative h-full w-full overflow-hidden bg-soot-950">
      <ScreenBackdrop src={CARD_SELECTION_BACKGROUND} />

      <MusicToggle className="absolute top-6 right-6 z-20" />

      <div className="relative flex h-full w-full items-stretch gap-4 p-5 pb-20 lg:gap-8 lg:p-8 lg:pb-24">
        {/* ------------------------------------------------------------ left */}
        <Panel title="Loadout" className="flex w-64 shrink-0 flex-col self-center lg:w-72">
          <div className="flex flex-col gap-2">
            {TYPE_ORDER.map((type) => (
              <CountRow
                key={type}
                label={TYPE_LABEL[type]}
                count={hand.filter((c) => c.type === type).length}
              />
            ))}
          </div>

          <p className="mt-4 border-t border-gold-500/20 pt-3 font-body text-xs leading-relaxed text-gold-200/50">
            Five cards go into the dungeon with you. Everyone starts with the same
            five — what you become is what you pick up down there.
          </p>

          <p className="mt-4 border-t border-gold-500/20 pt-3 font-body text-2xs leading-relaxed text-gold-200/35">
            All five are available every turn — there is no deck and no draw.
          </p>
        </Panel>

        {/* ---------------------------------------------------------- centre */}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto">
          <h1 className="shrink-0 font-display text-sm font-bold tracking-[0.22em] text-gold-300/80 uppercase">
            You are a {className}
          </h1>
          <p className="mt-1 shrink-0 font-body text-xs text-gold-200/45">
            {className} cards are earned in the dungeon, one Jira ticket at a time.
          </p>

          <div className="mt-6 grid w-full max-w-4xl shrink-0 grid-cols-5 gap-2 lg:max-w-5xl lg:gap-3">
            {hand.map((card, i) => (
              <GameCard key={`${card.id}-${i}`} card={card} playerName={playerName} />
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-3 bg-gradient-to-t from-soot-950 to-transparent p-5 lg:p-8">
        <ActionButton onClick={() => dispatch(goTo('pet'))}>Back</ActionButton>
        <ActionButton primary onClick={() => dispatch(goTo('map'))}>
          <span className="flex items-center gap-2.5">
            <img src={CASTLE_ICON} alt="" className="h-5 w-5 shrink-0" />
            Begin the Gauntlet
          </span>
        </ActionButton>
      </div>
    </main>
  )
}

function CountRow({ label, count }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-display text-2xs font-bold tracking-[0.18em] text-gold-200/45 uppercase">
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-body text-xs text-gold-300">{count}</span>
        <span className="flex gap-0.5">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full border border-gold-400/80 bg-gold-500/70"
            />
          ))}
        </span>
      </span>
    </div>
  )
}
