import { useSelector } from 'react-redux'
import roomData from '../../data/rooms.json'
import {
  idleSpriteNamed,
  resolveCharacterArt,
  resolveIdleSprite,
  resolveRoomBackground,
} from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import { ScreenBackdrop } from '../components/ui'
import { selectPlayer } from '../store/playerSlice'

/**
 * Screen 5 — a battle room.
 *
 * Staging only. Combat is not implemented: the room names who faces the player
 * and this draws them, falling back to an empty slot where the art is missing.
 *
 * The layout is built for a turn-based fight rather than a portrait screen.
 * The two sides face each other across the floor — player left, interviewers
 * right — and the lower band is deliberately left empty, because that is where
 * the hand of five goes (D16: every card available every turn, no draw). Both
 * sides are drawn small enough to leave it room; creation screens give a figure
 * the full height, a fight cannot.
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

export default function BattleRoom() {
  const { race, gender, class: classId } = useSelector(selectPlayer)

  const room = roomData.rooms.find((r) => r.number === ROOM_NUMBER)
  const background = resolveRoomBackground(room)
  const art = resolveCharacterArt({ race, gender, classId, pose: 'ready' })
  const sprite = resolveIdleSprite({ race, gender, classId, pose: 'ready' })

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
      <div className="relative flex h-full w-full items-stretch gap-6 px-6 pb-36 lg:gap-12 lg:px-16 lg:pb-44">
        {/* ------------------------------------------------------ left: you */}
        <div className="flex min-w-0 flex-1 items-end justify-center">
          {sprite ? (
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
        </div>

        {/* -------------------------------------------- right: interviewers */}
        <div className="flex min-w-0 flex-1 items-end justify-center gap-4 lg:gap-8">
          {room.enemies.map((name, i) => {
            const enemy = idleSpriteNamed(name)
            return enemy ? (
              <IdleSprite key={name} sprite={enemy} />
            ) : (
              <FigureSlot key={`${name}-${i}`} label="Interviewer" />
            )
          })}
        </div>
      </div>

      <DiscardPile className="absolute right-6 bottom-6 z-10 lg:right-10 lg:bottom-8" />
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
function DiscardPile({ className = '' }) {
  // Back to front. Each card below the top sits further out of square, so their
  // edges show along two sides and the pile reads as more than one card.
  const stack = [
    { rotate: -9, x: -9, y: 5, opacity: 0.55 },
    { rotate: 5, x: 6, y: -3, opacity: 0.8 },
    { rotate: 0, x: 0, y: 0, opacity: 1 },
  ]

  return (
    <div className={`${className} w-24 lg:w-28`} title="Discard">
      <div className="relative aspect-[5/7] w-full">
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
