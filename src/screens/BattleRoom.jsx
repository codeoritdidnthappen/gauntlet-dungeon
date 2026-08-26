import { useDispatch, useSelector } from 'react-redux'
import roomData from '../../data/rooms.json'
import { resolveCharacterArt, resolveRoomBackground } from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import { ActionButton, ScreenBackdrop } from '../components/ui'
import { goTo } from '../store/uiSlice'
import { selectPlayer } from '../store/playerSlice'

/**
 * Screen 5 — a battle room.
 *
 * Staging only. Combat is not implemented: the room declares how many
 * interviewers face the player and this draws that many placeholders.
 *
 * The layout is built for a turn-based fight rather than a portrait screen.
 * The two sides face each other across the floor — player left, interviewers
 * right — and the lower band is deliberately left empty, because that is where
 * the hand of five goes (D16: every card available every turn, no draw). Both
 * sides are drawn small enough to leave it room; creation screens give a figure
 * the full height, a fight cannot.
 */
const ROOM_NUMBER = 1

/** Share of the stage height a figure may fill. Creation screens use all of it. */
const FIGURE_HEIGHT = 0.58

export default function BattleRoom() {
  const dispatch = useDispatch()
  const { race, gender, class: classId } = useSelector(selectPlayer)

  const room = roomData.rooms.find((r) => r.number === ROOM_NUMBER)
  const background = resolveRoomBackground(room)
  const art = resolveCharacterArt({ race, gender, classId, pose: 'ready' })

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
          {art ? (
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
          {Array.from({ length: room.enemySlots }, (_, i) => (
            <FigureSlot key={i} label="Interviewer" />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------ actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-3 bg-gradient-to-t from-soot-950 to-transparent p-5 lg:p-8">
        <ActionButton onClick={() => dispatch(goTo('cards'))}>Back</ActionButton>
      </div>
    </main>
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
