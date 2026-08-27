import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cardData from '../../data/cards.json'
import enemyCardData from '../../data/enemy-cards.json'
import roomData from '../../data/rooms.json'
import {
  enemyStillNamed,
  idleSpriteNamed,
  resolveCharacterArt,
  resolveIdleSprite,
  resolveRoomBackground,
} from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import GameCard from '../components/GameCard'
import { ActionButton, ScreenBackdrop } from '../components/ui'
import { resolveAttack } from '../battle/damage'
import {
  gainBlock,
  selectDisplayName,
  selectLoadout,
  selectPlayer,
  selectStats,
  spendEnergy,
  startTurn,
  takeDamage,
} from '../store/playerSlice'

/**
 * Screen 5 — a battle room.
 *
 * The room names who faces the player and this draws them, falling back to an
 * empty slot where the art is missing.
 *
 * The layout is built for a turn-based fight rather than a portrait screen. The
 * two sides face each other across the floor — player left, interviewers right —
 * with a health bar under each, and the lower band carries the hand fanned
 * across the centre, End Turn and the discard to the right. Both figures are
 * drawn small enough to leave that band room; creation screens give a figure the
 * full height, a fight cannot.
 *
 * Room 1 is scripted and the player moves first, so the hand is live from the
 * moment the room opens. A card costs energy, puts the figure in the pose it
 * calls for — sword for an attack, scroll for a power — and flies to the pile as
 * it is played. An attack also throws the interviewer into its hit pose, reeling
 * the other way on the same clock, so the two read as one exchange. The rest stay in hand until the energy runs out, and then follow
 * it, since nothing left is playable. End Turn refills it,
 * resets block, and deals the same five again — one loadout, no deck, so every
 * turn opens with the same hand until there are more cards to draw from.
 *
 * Blows land for real: a card's damage is measured against the target's guard,
 * what the guard cannot cover comes off health, and both sides take it the same
 * way (src/battle/damage.js). Nothing is awarded for winning yet — the map does
 * not advance — so a settled fight just stops.
 *
 * End Turn hands over: the interviewer shows the card it is playing low in the
 * middle of the room, above the hand, sends it to the same pile, and swings — the two figures
 * closing on each other exactly as they do when the player attacks, with the
 * art swapped for who is swinging, and the player raising a guard against it.
 *
 * There is no way out. A room is entered, not visited: it ends by being won or
 * lost, so this screen offers no navigation at all.
 */
const ROOM_NUMBER = 1

/** Which interviewer an attack goes at. Rooms hold one, so there is no choice. */
const TARGET = 0

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

/**
 * What an interviewer opens with. The `intro` subtype is the gentle end of the
 * enemy deck — an opening question, four or five damage — which is what Room 1
 * wants until intents are authored per enemy.
 */
const INTRO_ATTACKS = enemyCardData.cards.filter((c) => c.type === 'attack' && c.subtype === 'intro')

/** How long the interviewer's card sits in the middle before it is played. */
const REVEAL_MS = 900

/** How long the figure holds the card's pose. Matches the cast-pose keyframe. */
const CAST_MS = 2000

/** How long the hand takes to reach the pile. */
const DISCARD_MS = 480

export default function BattleRoom() {
  const { race, gender, class: classId } = useSelector(selectPlayer)
  const dispatch = useDispatch()
  const { health, maxHealth, energy, maxEnergy, block } = useSelector(selectStats)
  const loadout = useSelector(selectLoadout)
  const playerName = useSelector(selectDisplayName)

  /** The five carried in, in the order they were dealt. */
  const hand = useMemo(() => loadout.map((id) => CARD_BY_ID[id]).filter(Boolean), [loadout])

  const room = roomData.rooms.find((r) => r.number === ROOM_NUMBER)

  /**
   * The interviewers' health and guard.
   *
   * Local, unlike the player's: ARCHITECTURE.md §4 saves at the map and never
   * mid-fight, so nothing about a half-finished room may reach the store. They
   * come in at full health with no guard up.
   */
  const [foes, setFoes] = useState(() =>
    room.enemies.map((e) => ({ health: e.maxHealth, block: 0 })),
  )
  /**
   * Whether the fight is decided, and for whom. Nothing is awarded for it yet —
   * beating a room does not advance the map — but a settled fight stops taking
   * turns rather than carrying on past zero.
   */
  const over = health <= 0 ? 'defeat' : foes.every((f) => f.health <= 0) ? 'victory' : null

  const background = resolveRoomBackground(room)
  const art = resolveCharacterArt({ race, gender, classId, pose: 'ready' })
  const sprite = resolveIdleSprite({ race, gender, classId, pose: 'ready' })
  // The poses a fight puts the figure in: two a card calls for, and one for
  // being attacked. Every fighter has a defend drawn; sword and scroll are the
  // human's alone so far, and a figure without one keeps its idle.
  //
  // Insisting on class art is the point: asked for a pose it does not have,
  // resolveCharacterArt falls back to the plain creation-screen portrait, which
  // is the right answer on the creation screens and the wrong one here — it
  // ignores the pose, so the figure sheds its armour to swing or to be hit.
  // Better no pose at all, and the idle keeps the movement.
  const poseArt = (pose) => {
    const found = resolveCharacterArt({ race, gender, classId, pose })
    return found?.isClassArt ? found : null
  }
  const poses = { power: poseArt('scroll'), attack: poseArt('sword') }
  const defending = poseArt('defend')


  // The pose currently being held, or null. Momentary and purely shown, so it is
  // local: nothing outside this screen has any use for it.
  const [cast, setCast] = useState(null)
  const castTimer = useRef(null)

  // Whether the interviewers are taking a hit. Runs to the same clock as the
  // player's pose, so the blow and the reaction are one exchange.
  const [struck, setStruck] = useState(false)
  const struckTimer = useRef(null)

  // The interviewer's turn: the card it played, and whether it is still being
  // read or already landing. Null between turns.
  const [enemyTurn, setEnemyTurn] = useState(null)
  const enemyTimers = useRef([])
  const enemyCardRef = useRef(null)
  const [enemyCardFlight, setEnemyCardFlight] = useState(null)
  // Whichever side is acting, both close on each other. Only the art differs by
  // who is swinging, so a missing pose costs the picture, not the movement.
  const enemyStriking = enemyTurn?.phase === 'strike'
  const playerPose = enemyStriking ? defending : cast
  const playerMoving = enemyStriking || Boolean(cast)

  // A played card flies to the pile and then leaves the hand. `flights` holds
  // the trip for each card still travelling, by its place in the hand; `played`
  // is the ones already gone. Both are per-turn and per-room, and
  // ARCHITECTURE.md §4 keeps combat state out of the save deliberately, so
  // neither belongs in the store.
  const [flights, setFlights] = useState({})
  const [played, setPlayed] = useState(() => new Set())
  const pileRef = useRef(null)
  const cardRefs = useRef([])

  useEffect(
    () => () => {
      clearTimeout(castTimer.current)
      clearTimeout(struckTimer.current)
      enemyTimers.current.forEach(clearTimeout)
    },
    [],
  )

  // Walking in starts a turn (ARCHITECTURE.md §5). Without it the room opens on
  // whatever energy the save happened to hold — energy is saved along with the
  // rest of the player, and a turn's leftovers are not a state to arrive in.
  useEffect(() => {
    dispatch(startTurn())
  }, [dispatch])

  /**
   * Send one card to the pile.
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
  const discardCard = (i) => {
    const el = cardRefs.current[i]
    const pile = pileRef.current?.getBoundingClientRect()
    if (!el || !pile) return

    el.style.setProperty('transform', 'none')
    const r = el.getBoundingClientRect()
    el.style.removeProperty('transform')

    setFlights((f) => ({
      ...f,
      [i]: {
        dx: pile.left + pile.width / 2 - (r.left + r.width / 2),
        dy: pile.top + pile.height / 2 - (r.top + r.height / 2),
      },
    }))

    setTimeout(() => {
      setPlayed((p) => new Set(p).add(i))
      setFlights((f) => {
        const next = { ...f }
        delete next[i]
        return next
      })
    }, DISCARD_MS)
  }

  /**
   * What a card does when it is played.
   *
   * Attacks go at the first interviewer — rooms hold one for now, and picking a
   * target is a screen of its own once they hold more. Defends put guard up.
   *
   * Only the numbers on the card are read. Every rider in the card text —
   * Wallop's block, Riposte's second hit, the powers — is still unbuilt, so
   * those cards land their base damage and nothing else.
   */
  const resolvePlayerCard = (card) => {
    if (card.type === 'defend' && card.block) {
      dispatch(gainBlock(card.block))
      return
    }

    if (card.type === 'attack') {
      setFoes((current) =>
        current.map((foe, i) => {
          if (i !== TARGET) return foe
          const after = resolveAttack({ card, block: foe.block, health: foe.health })
          return { block: after.block, health: after.health }
        }),
      )
    }
  }

  const playCard = (card, i) => {
    if (over || played.has(i) || flights[i] || card.cost > energy) return

    dispatch(spendEnergy(card.cost))
    resolvePlayerCard(card)

    const pose = poses[card.type]
    if (pose) {
      clearTimeout(castTimer.current)
      setCast(pose)
      castTimer.current = setTimeout(() => setCast(null), CAST_MS)
    }

    if (card.type === 'attack') {
      clearTimeout(struckTimer.current)
      setStruck(true)
      struckTimer.current = setTimeout(() => setStruck(false), CAST_MS)
    }

    discardCard(i)

    // Out of energy: nothing left is playable, so the rest of the hand goes with
    // it rather than sitting there greyed out.
    if (energy - card.cost <= 0) {
      hand.forEach((_, j) => {
        if (j !== i && !played.has(j) && !flights[j]) discardCard(j)
      })
    }
  }

  /**
   * End the turn and hand it to the interviewer.
   *
   * It shows what it is playing before it plays it — ARCHITECTURE.md §5 calls
   * the telegraph load-bearing, and a card read in the middle of the room is the
   * plainest form of it. Then the card goes to the pile and the blow lands, and
   * only after that does the player's next turn begin.
   */
  const endTurn = () => {
    if (over || enemyTurn) return

    const card = INTRO_ATTACKS[Math.floor(Math.random() * INTRO_ATTACKS.length)]
    setEnemyTurn({ card, phase: 'reveal' })

    enemyTimers.current = [
      setTimeout(() => {
        setEnemyTurn({ card, phase: 'strike' })
        flyEnemyCard()
        // The blow lands with the animation that shows it landing.
        dispatch(takeDamage(card))
      }, REVEAL_MS),

      setTimeout(() => {
        setEnemyTurn(null)
        setEnemyCardFlight(null)
        dispatch(startTurn())
        setPlayed(new Set())
        setFlights({})
      }, REVEAL_MS + CAST_MS),
    ]
  }

  /** The interviewer's card takes the same measured trip the player's cards do. */
  const flyEnemyCard = () => {
    const el = enemyCardRef.current
    const pile = pileRef.current?.getBoundingClientRect()
    if (!el || !pile) return

    el.style.setProperty('transform', 'none')
    const r = el.getBoundingClientRect()
    el.style.removeProperty('transform')

    setEnemyCardFlight({
      dx: pile.left + pile.width / 2 - (r.left + r.width / 2),
      dy: pile.top + pile.height / 2 - (r.top + r.height / 2),
    })
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
          {playerPose ? (
            <img
              key={playerPose.key}
              src={playerPose.url}
              alt=""
              style={{
                maxHeight: `${playerPose.scale * FIGURE_HEIGHT * 100}%`,
                animation: `clash-right ${CAST_MS}ms ease-in-out`,
              }}
              className="w-auto origin-bottom object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
            />
          ) : sprite ? (
            <IdleSprite
              sprite={sprite}
              slowdown={PLAYER_IDLE_SLOWDOWN}
              // No struck pose drawn for this figure: it still gives ground, so
              // the exchange reads even without the art.
              animation={playerMoving ? `clash-right ${CAST_MS}ms ease-in-out` : undefined}
            />
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
            const still = enemyStillNamed(
              enemyStriking ? `${enemy.art}-attack` : `${enemy.art}-hit`,
            )
            const showStill = (enemyStriking || struck) && still
            const moving = enemyStriking || struck

            return (
              <div
                key={enemy.art ?? i}
                className="flex min-w-0 flex-col items-center justify-end"
              >
                {showStill ? (
                  <img
                    src={still}
                    alt=""
                    style={{
                      maxHeight: `${FIGURE_HEIGHT * 100}%`,
                      animation: `clash-left ${CAST_MS}ms ease-in-out`,
                    }}
                    className="w-auto origin-bottom object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
                  />
                ) : idle ? (
                  <IdleSprite
                    sprite={idle}
                    animation={moving ? `clash-left ${CAST_MS}ms ease-in-out` : undefined}
                  />
                ) : (
                  <FigureSlot label={enemy.name} />
                )}
                <HealthBar current={foes[i].health} max={enemy.maxHealth} />
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
        {hand.map((card, i) => {
          if (played.has(i)) return null

          const fromCentre = i - (hand.length - 1) / 2
          const trip = flights[i]
          const affordable = card.cost <= energy && !trip
          return (
            <button
              key={`${card.id}-${i}`}
              // Braces, not an implicit return: React 19 reads a value returned
              // from a callback ref as a cleanup function.
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              type="button"
              onClick={() => playCard(card, i)}
              disabled={!affordable}
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
                'pointer-events-auto w-36 origin-bottom lg:w-40',
                'transition-transform duration-150 ease-out outline-none',
                'focus-visible:ring-2 focus-visible:ring-gold-400',
                // Out of reach this turn: dimmed, and it does not rise to meet
                // the cursor either, so the hand says what can be played.
                affordable ? 'cursor-pointer' : 'cursor-not-allowed opacity-45 grayscale',
                // The fan and the hover both write `transform`, so hovering
                // replaces the fan rather than stacking on top of it — set as
                // separate rotate/translate properties they would compose, and
                // an outer card would rise still tilted.
                '[transform:rotate(var(--fan-rotate))_translateY(var(--fan-drop))]',
                affordable ? 'hover:z-30 hover:[transform:translateY(-3.5rem)_scale(1.3)]' : '',
              ].join(' ')}
            >
              <GameCard card={card} playerName={playerName} />
            </button>
          )
        })}
      </div>

      {/* The interviewer's card, read in the middle of the room before it lands
          and then sent to the same pile the player's cards go to. */}
      {enemyTurn && (
        <div className="pointer-events-none absolute inset-x-0 bottom-44 z-30 flex justify-center lg:bottom-52">
          <div
            ref={enemyCardRef}
            style={
              enemyCardFlight
                ? {
                    '--fan-rotate': '0deg',
                    '--fan-drop': '0px',
                    '--fly-x': `${enemyCardFlight.dx}px`,
                    '--fly-y': `${enemyCardFlight.dy}px`,
                    animation: `discard-flight ${DISCARD_MS}ms ease-in forwards`,
                    transformOrigin: 'center',
                  }
                : undefined
            }
            className="w-40 lg:w-44"
          >
            <p className="mb-2 text-center font-display text-3xs tracking-[0.18em] text-gold-200/50 uppercase">
              {room.enemies[0]?.name ?? 'Interviewer'}
            </p>
            <GameCard card={enemyTurn.card} playerName={playerName} />
          </div>
        </div>
      )}

      {/* Energy, where the player is already looking when choosing a card. */}
      <div className="absolute bottom-8 left-8 z-20 text-center lg:bottom-10 lg:left-12">
        <p className="font-display text-3xl font-bold text-gold-300">
          {energy}
          <span className="text-gold-200/40">/{maxEnergy}</span>
        </p>
        <p className="font-display text-3xs tracking-[0.18em] text-gold-200/45 uppercase">Energy</p>
        {block > 0 && (
          <p className="mt-2 font-body text-2xs text-sky-200/80">{block} block</p>
        )}
      </div>

      {over && (
        <p className="-translate-x-1/2 pointer-events-none absolute bottom-64 left-1/2 z-30 font-display text-2xl text-gold-200 tracking-[0.2em] uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          {over === 'victory' ? 'Interview passed' : 'Interview over'}
        </p>
      )}

      {/* ---------------------------------------------------------- controls */}
      <div className="absolute right-6 bottom-6 z-20 flex flex-col items-end gap-3 lg:right-10 lg:bottom-8">
        {/* Out of energy and the turn still open: nothing in hand can be played,
            so the only move left is the one that pulses. */}
        <ActionButton
          primary
          onClick={endTurn}
          disabled={Boolean(enemyTurn) || Boolean(over)}
          className={
            energy === 0 && !enemyTurn && !over
              ? '[animation:end-turn-ready_1.6s_ease-in-out_infinite]'
              : ''
          }
        >
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
function IdleSprite({ sprite, slowdown = 1, animation }) {
  const { frameWidth, frameHeight, frameCount, fps } = sprite.meta
  const seconds = (frameCount / fps) * slowdown

  return (
    <div
      aria-hidden="true"
      // A window exactly one frame wide, with the sheet sliding behind it. The
      // window can itself be animated — a figure with no still to swap to still
      // takes part in an exchange, breathing as it moves.
      style={{
        height: `${FIGURE_HEIGHT * 100}%`,
        aspectRatio: `${frameWidth} / ${frameHeight}`,
        animation,
      }}
      className="origin-bottom overflow-hidden drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
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
