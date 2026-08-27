import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import cardData from '../../data/cards.json'
import roomData from '../../data/rooms.json'
import {
  idleSpriteNamed,
  resolveCharacterArt,
  resolveIdleSprite,
  resolveRoomBackground,
} from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import GameCard from '../components/GameCard'
import { ActionButton, ScreenBackdrop } from '../components/ui'
import { selectDisplayName, selectLoadout, selectPlayer, selectStats } from '../store/playerSlice'

/**
 * Screen 5 — a battle room.
 *
 * Staging only. Combat is not implemented: the room names who faces the player
 * and this draws them, falling back to an empty slot where the art is missing.
 *
 * The layout is built for a turn-based fight rather than a portrait screen. The
 * two sides face each other across the floor — player left, interviewers right —
 * with a health bar under each, and the lower band carries the hand fanned
 * across the centre, End Turn and the discard to the right. Both figures are
 * drawn small enough to leave that band room; creation screens give a figure the
 * full height, a fight cannot.
 *
 * Room 1 is scripted and the player moves first, so the hand is live from the
 * moment the room opens. Playing a card discards the whole hand — every card
 * flies to the pile, not just the one played.
 *
 * Nothing else resolves yet: no energy is spent, no damage dealt, End Turn ends
 * nothing, and once the hand has gone nothing brings it back.
 *
 * There is no way out. A room is entered, not visited: it ends by being won or
 * lost, so this screen offers no navigation at all.
 */
const ROOM_NUMBER = 1

/** Share of the stage height a figure may fill. Creation screens use all of it. */
const FIGURE_HEIGHT = 0.58

/**
 * How much longer the player's idle takes than the sheet's own rate.
 *
 * The two sides must never breathe in step — matching loops read as one
 * animation driving both figures. That is a relationship between the sides
 * rather than a property of any one sheet, so it lives here: one number, all
 * six player sheets, and it survives the sheets being regenerated. 1.09 is 9%
 * slower.
 */
const PLAYER_IDLE_SLOWDOWN = 1.09

const CARD_BY_ID = Object.fromEntries(cardData.cards.map((c) => [c.id, c]))

/** How long the figure stays in the scroll pose. Matches the cast-scroll keyframe. */
const CAST_MS = 2000

/** How long the hand takes to reach the pile. */
const DISCARD_MS = 480

export default function BattleRoom() {
  const { race, gender, class: classId } = useSelector(selectPlayer)
  const { health, maxHealth } = useSelector(selectStats)
  const loadout = useSelector(selectLoadout)
  const playerName = useSelector(selectDisplayName)

  /** The five carried in, in the order they were dealt. */
  const hand = useMemo(() => loadout.map((id) => CARD_BY_ID[id]).filter(Boolean), [loadout])

  const room = roomData.rooms.find((r) => r.number === ROOM_NUMBER)
  const background = resolveRoomBackground(room)
  const art = resolveCharacterArt({ race, gender, classId, pose: 'ready' })
  const sprite = resolveIdleSprite({ race, gender, classId, pose: 'ready' })
  const scroll = resolveCharacterArt({ race, gender, classId, pose: 'scroll' })

  // Playing a power reads the scroll. Momentary and purely shown, so it is
  // local: nothing outside this screen has any use for it.
  const [casting, setCasting] = useState(false)
  const castTimer = useRef(null)

  // Playing anything discards the whole hand. `flight` holds each card's trip to
  // the pile, measured when it starts; `spent` is the hand being gone.
  const [flight, setFlight] = useState(null)
  const [spent, setSpent] = useState(false)
  const discardTimer = useRef(null)
  const pileRef = useRef(null)
  const cardRefs = useRef([])

  useEffect(
    () => () => {
      clearTimeout(castTimer.current)
      clearTimeout(discardTimer.current)
    },
    [],
  )

  /**
   * Send the hand to the pile.
   *
   * The trip is measured rather than guessed: each card is asked where it is and
   * the pile where it is, so the cards converge on it wherever the layout has
   * put them, at any window size.
   *
   * Measured with the fan switched off. The flight's transform replaces the
   * fan's rather than adding to it, so a card travels from where it would sit
   * unfanned — measure it fanned and every card lands short by however far the
   * fan had moved it.
   *
   * The target is the middle of the stack itself, not of the pile's box: that
   * box includes the caption beneath, whose centre is lower than the cards'.
   */
  const discardHand = () => {
    const pile = pileRef.current?.getBoundingClientRect()
    if (!pile || spent) return

    const target = { x: pile.left + pile.width / 2, y: pile.top + pile.height / 2 }
    setFlight(
      cardRefs.current.map((el) => {
        if (!el) return { dx: 0, dy: 0 }
        el.style.setProperty('transform', 'none')
        const r = el.getBoundingClientRect()
        el.style.removeProperty('transform')
        return { dx: target.x - (r.left + r.width / 2), dy: target.y - (r.top + r.height / 2) }
      }),
    )

    discardTimer.current = setTimeout(() => {
      setFlight(null)
      setSpent(true)
    }, DISCARD_MS)
  }

  const playCard = (card) => {
    if (spent) return

    // Only a power has a scroll to read, and only where that pose is drawn —
    // the other races have no scroll art yet, so their figure stays as it is.
    if (card.type === 'power' && scroll) {
      clearTimeout(castTimer.current)
      setCasting(true)
      castTimer.current = setTimeout(() => setCasting(false), CAST_MS)
    }

    // Whatever was played, the whole hand goes.
    discardHand()
  }

  return (
    <main className="relative h-full w-full overflow-hidden bg-soot-950">
      {background && <ScreenBackdrop src={background} />}

      <MusicToggle className="absolute top-6 right-6 z-20" />

      <h1 className="absolute top-6 left-6 z-10 font-display text-sm font-bold tracking-[0.22em] text-gold-300 uppercase">
        {room.name}
      </h1>

      {/* ------------------------------------------------------------- stage */}
      {/* items-stretch, not items-end: the columns need a definite height for
          the figures below to size against a share of it. */}
      <div className="relative flex h-full w-full items-stretch gap-6 px-6 pb-48 lg:gap-12 lg:px-16 lg:pb-56">
        {/* ------------------------------------------------------ left: you */}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
          {casting ? (
            <img
              key={scroll.key}
              src={scroll.url}
              alt=""
              style={{
                maxHeight: `${scroll.scale * FIGURE_HEIGHT * 100}%`,
                animation: `cast-scroll ${CAST_MS}ms ease-in-out`,
              }}
              className="w-auto origin-bottom object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
            />
          ) : sprite ? (
            <IdleSprite sprite={sprite} slowdown={PLAYER_IDLE_SLOWDOWN} />
          ) : art ? (
            <img
              key={art.key}
              src={art.url}
              alt=""
              // Scaled from the bottom so the feet stay planted, as on the
              // creation screens — just to a share of the height, not all of it.
              style={{ maxHeight: `${art.scale * FIGURE_HEIGHT * 100}%` }}
              className="w-auto object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
            />
          ) : (
            <FigureSlot label="You" />
          )}

          <HealthBar current={health} max={maxHealth} />
        </div>

        {/* -------------------------------------------- right: interviewers */}
        <div className="flex min-w-0 flex-1 items-stretch justify-center gap-4 lg:gap-8">
          {room.enemies.map((enemy, i) => {
            const idle = idleSpriteNamed(enemy.art)
            return (
              <div
                key={enemy.art ?? i}
                className="flex min-w-0 flex-col items-center justify-end"
              >
                {idle ? <IdleSprite sprite={idle} /> : <FigureSlot label={enemy.name} />}
                <HealthBar current={enemy.maxHealth} max={enemy.maxHealth} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- hand */}
      {/* Fanned from the centre and hanging off the bottom edge, so five cards
          fit across without shrinking past reading size. Hovering lifts one
          clear of its neighbours — overlapped, they cannot be read otherwise. */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-16 z-10 flex items-end justify-center">
        {!spent &&
          hand.map((card, i) => {
            const fromCentre = i - (hand.length - 1) / 2
            const trip = flight?.[i]
            return (
            <button
              key={`${card.id}-${i}`}
              // Braces, not an implicit return: React 19 reads a value returned
              // from a callback ref as a cleanup function.
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              type="button"
              onClick={() => playCard(card)}
              aria-label={`Play ${card.name}`}
              style={{
                '--fan-rotate': `${fromCentre * 4}deg`,
                '--fan-drop': `${Math.abs(fromCentre) * 12}px`,
                marginInline: '-0.9rem',
                zIndex: i,
                // In flight the keyframe takes over: it states its own start,
                // so it does not have to out-rank the fan's transform.
                ...(trip && {
                  '--fly-x': `${trip.dx}px`,
                  '--fly-y': `${trip.dy}px`,
                  animation: `discard-flight ${DISCARD_MS}ms ease-in forwards`,
                  // The fan scales about the bottom edge; the trip was measured
                  // centre to centre. Scaling about the centre for the flight
                  // makes the two agree, or the cards land low of the pile.
                  transformOrigin: 'center',
                  pointerEvents: 'none',
                }),
              }}
              className={[
                'pointer-events-auto w-36 cursor-pointer origin-bottom lg:w-40',
                'transition-transform duration-150 ease-out outline-none',
                'focus-visible:ring-2 focus-visible:ring-gold-400',
                // The fan and the hover both write `transform`, so hovering
                // replaces the fan rather than stacking on top of it — set as
                // separate rotate/translate properties they would compose, and
                // an outer card would rise still tilted.
                '[transform:rotate(var(--fan-rotate))_translateY(var(--fan-drop))]',
                'hover:z-30 hover:[transform:translateY(-3.5rem)_scale(1.3)]',
              ].join(' ')}
            >
              <GameCard card={card} playerName={playerName} />
            </button>
            )
          })}
      </div>

      {/* ---------------------------------------------------------- controls */}
      <div className="absolute right-6 bottom-6 z-20 flex flex-col items-end gap-3 lg:right-10 lg:bottom-8">
        <ActionButton primary onClick={() => {}}>
          End Turn
        </ActionButton>
        <DiscardPile stackRef={pileRef} />
      </div>
    </main>
  )
}

/**
 * Where played cards land at the end of a turn.
 *
 * Drawn rather than illustrated: three card backs in the same shape and frame as
 * the cards themselves — 5:7, the same rounding and border — so the pile reads
 * as those cards face down without needing art of its own. Swap in an image
 * later by replacing the stack, not the placement.
 *
 * Empty for now, and drawn all the same, so the player learns where the pile is
 * before anything is in it.
 */
function DiscardPile({ className = '', stackRef = null }) {
  // Back to front. Each card below the top sits further out of square, so their
  // edges show along two sides and the pile reads as more than one card.
  const stack = [
    { rotate: -9, x: -9, y: 5, opacity: 0.55 },
    { rotate: 5, x: 6, y: -3, opacity: 0.8 },
    { rotate: 0, x: 0, y: 0, opacity: 1 },
  ]

  return (
    <div className={`${className} w-14 lg:w-16`} title="Discard">
      <div ref={stackRef} className="relative aspect-[5/7] w-full">
        {stack.map(({ rotate, x, y, opacity }, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{ transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`, opacity }}
            className={[
              'absolute inset-0 rounded-xl border-[3px] border-gold-500/45',
              'bg-soot-900 shadow-[0_8px_24px_rgba(0,0,0,0.7)]',
            ].join(' ')}
          >
            {/* A plain gold frame for the back, so a face-down card is
                obviously not a face-up one. */}
            <div className="absolute inset-[10%] rounded-md border border-gold-500/35" />
          </div>
        ))}
      </div>

      <p className="mt-1.5 text-center font-display text-3xs tracking-[0.18em] text-gold-200/40 uppercase">
        Discard
      </p>
    </div>
  )
}

/**
 * A combatant's health, under their feet.
 *
 * Reads as a bar plus the numbers, because a bar alone cannot tell 3 from 4 and
 * this is a game about arithmetic.
 */
function HealthBar({ current, max }) {
  if (!max) return null
  const share = Math.max(0, Math.min(1, current / max))

  return (
    <div className="mt-3 w-32 shrink-0 lg:w-40">
      <div className="h-2 w-full overflow-hidden rounded-sm border border-soot-950/80 bg-soot-950/70">
        <div
          style={{ width: `${share * 100}%` }}
          className="h-full bg-red-800 transition-[width] duration-300 ease-out"
        />
      </div>
      <p className="mt-1 text-center font-body text-2xs text-gold-200/80">
        {current} / {max}
      </p>
    </div>
  )
}

/**
 * A figure standing and breathing, played from a sprite sheet.
 *
 * The sheet is one row of frames, so playback is a background-position sweep in
 * `steps()` — no JS runs per frame, and the browser composites it. Frame size,
 * count and rate all come from the sheet's own metadata, so a sheet cut
 * differently plays correctly without a code change. `slowdown` stretches that
 * rate for a figure that should not run at it.
 */
function IdleSprite({ sprite, slowdown = 1 }) {
  const { frameWidth, frameHeight, frameCount, fps } = sprite.meta
  const seconds = (frameCount / fps) * slowdown

  return (
    <div
      aria-hidden="true"
      // A window exactly one frame wide, with the sheet sliding behind it.
      style={{ height: `${FIGURE_HEIGHT * 100}%`, aspectRatio: `${frameWidth} / ${frameHeight}` }}
      className="overflow-hidden drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
    >
      <img
        src={sprite.url}
        alt=""
        // Full height and natural width makes the sheet exactly frameCount
        // windows wide, so translating it by its own width steps one frame at a
        // time. max-w-none keeps the browser from shrinking it to fit.
        style={{ animation: `sprite-frames ${seconds}s steps(${frameCount}) infinite` }}
        className="h-full w-auto max-w-none"
      />
    </div>
  )
}

/**
 * Stands in for a figure that has no art — every interviewer, for now, and the
 * player on a race/gender/class combination nobody has drawn yet.
 */
function FigureSlot({ label }) {
  return (
    <div
      style={{ height: `${FIGURE_HEIGHT * 100}%` }}
      className="flex w-32 flex-col items-center justify-end rounded-sm border border-dashed border-gold-500/40 bg-soot-950/65 p-3 lg:w-40"
    >
      <span className="font-display text-2xs tracking-[0.18em] text-gold-200/40 uppercase">
        {label}
      </span>
    </div>
  )
}
