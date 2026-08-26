import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cardData from '../../data/cards.json'
import options from '../../data/character-options.json'
import { CARD_SELECTION_BACKGROUND } from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import GameCard from '../components/GameCard'
import { ActionButton, Panel, ScreenBackdrop } from '../components/ui'
import { goTo } from '../store/uiSlice'
import { addCard, removeCard, selectClassId, selectLoadout } from '../store/playerSlice'

/**
 * Screen 4 — Card selection.
 *
 * The player builds their starting loadout: 5 attack, 4 defend, 1 power
 * (D15). The pool is their class's cards plus neutrals.
 *
 * Duplicates are allowed, and have to be: no class has four *distinct* defend
 * cards, and the Duelist has only four attacks. It also matches D15's stated
 * starting loadout of 5× Strike and 4× Defend.
 *
 * The loadout lives in Redux as a flat array of ids with duplicates repeated,
 * matching SCHEMA.md §9.
 */
const QUOTA = { attack: 5, defend: 4, power: 1 }
const TYPE_ORDER = ['attack', 'defend', 'power']
const TYPE_LABEL = { attack: 'Attack', defend: 'Defend', power: 'Power' }

const CARD_BY_ID = Object.fromEntries(cardData.cards.map((c) => [c.id, c]))

export default function CardSelection() {
  const dispatch = useDispatch()
  const classId = useSelector(selectClassId) ?? 'fighter'
  const loadout = useSelector(selectLoadout)

  const className = options.classes.find((c) => c.id === classId)?.name ?? classId

  const byType = useMemo(() => {
    const pool = cardData.cards.filter((c) => c.class === classId || c.class === 'neutral')
    return TYPE_ORDER.map((type) => ({ type, cards: pool.filter((c) => c.type === type) }))
  }, [classId])

  /** How many copies of each card, and how many of each type. */
  const { copies, counts } = useMemo(() => {
    const copies = {}
    const counts = { attack: 0, defend: 0, power: 0 }
    for (const id of loadout) {
      copies[id] = (copies[id] ?? 0) + 1
      const card = CARD_BY_ID[id]
      if (card) counts[card.type] += 1
    }
    return { copies, counts }
  }, [loadout])

  const complete = TYPE_ORDER.every((t) => counts[t] === QUOTA[t])
  const total = loadout.length

  const add = (card) => {
    if (counts[card.type] >= QUOTA[card.type]) return
    dispatch(addCard(card.id))
  }

  return (
    <main className="relative h-full w-full overflow-hidden bg-soot-950">
      <ScreenBackdrop src={CARD_SELECTION_BACKGROUND} />

      <MusicToggle className="absolute top-6 right-6 z-20" />

      <div className="relative flex h-full w-full items-stretch gap-4 p-5 pb-20 lg:gap-8 lg:p-8 lg:pb-24">
        {/* ------------------------------------------------------------ left */}
        <Panel title="Loadout" className="flex w-64 shrink-0 flex-col self-center lg:w-72">
          <div className="flex flex-col gap-2">
            {TYPE_ORDER.map((type) => (
              <QuotaRow
                key={type}
                label={TYPE_LABEL[type]}
                have={counts[type]}
                need={QUOTA[type]}
              />
            ))}
          </div>

          <div className="mt-4 border-t border-gold-500/20 pt-3">
            {total === 0 ? (
              <p className="font-body text-xs leading-relaxed text-gold-200/40">
                Ten cards go into the dungeon with you. Choose {QUOTA.attack} attack,{' '}
                {QUOTA.defend} defend and {QUOTA.power} power.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {Object.entries(copies).map(([id, n]) => (
                  <li
                    key={id}
                    className="flex items-baseline justify-between gap-2 font-body text-xs text-gold-200/70"
                  >
                    <span className="truncate">{CARD_BY_ID[id]?.name}</span>
                    <span className="shrink-0 text-gold-200/40">×{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="mt-4 border-t border-gold-500/20 pt-3 font-body text-[11px] leading-relaxed text-gold-200/35">
            All ten are available every turn — there is no deck and no draw.
          </p>
        </Panel>

        {/* ---------------------------------------------------------- centre */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <h1 className="mb-3 shrink-0 font-display text-sm font-bold tracking-[0.22em] text-gold-300/80 uppercase">
            {className} cards
          </h1>

          <div className="flex flex-col gap-5">
            {byType.map(({ type, cards }) => (
              <section key={type}>
                <div className="mb-2 flex items-baseline gap-3">
                  <h2 className="font-display text-xs font-bold tracking-[0.18em] text-gold-200/50 uppercase">
                    {TYPE_LABEL[type]}
                  </h2>
                  <span className="font-body text-[11px] text-gold-200/30">
                    {counts[type]} of {QUOTA[type]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {cards.map((card) => (
                    <GameCard
                      key={card.id}
                      card={card}
                      count={copies[card.id] ?? 0}
                      onAdd={() => add(card)}
                      onRemove={() => dispatch(removeCard(card.id))}
                      disabled={counts[type] >= QUOTA[type]}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-3 bg-gradient-to-t from-soot-950 to-transparent p-5 lg:p-8">
        <ActionButton onClick={() => dispatch(goTo('pet'))}>Back</ActionButton>
        <ActionButton primary disabled={!complete} onClick={() => dispatch(goTo('cards'))}>
          {complete ? 'Proceed' : `Proceed (${total}/10)`}
        </ActionButton>
      </div>
    </main>
  )
}

function QuotaRow({ label, have, need }) {
  const full = have === need
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-display text-[11px] font-bold tracking-[0.18em] text-gold-200/45 uppercase">
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        <span className={['font-body text-xs', full ? 'text-gold-300' : 'text-gold-200/50'].join(' ')}>
          {have}/{need}
        </span>
        <span className="flex gap-0.5">
          {Array.from({ length: need }, (_, i) => (
            <span
              key={i}
              className={[
                'h-1.5 w-1.5 rounded-full border',
                i < have ? 'border-gold-400/80 bg-gold-500/70' : 'border-gold-500/25 bg-transparent',
              ].join(' ')}
            />
          ))}
        </span>
      </span>
    </div>
  )
}
