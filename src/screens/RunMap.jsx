import { useDispatch, useSelector } from 'react-redux'
import roomData from '../../data/rooms.json'
import { resolveMap, resolveRoomIcon } from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import { goTo } from '../store/uiSlice'
import { selectNextRoomIndex } from '../store/playerSlice'

/**
 * Screen 5 — the run map.
 *
 * Between the loadout and the first fight, and where the player comes back to
 * between fights. The route is a single crooked line of rooms running left to
 * right (D3: no branching, one path).
 *
 * The circles and the dotted line joining them are painted into the parchment.
 * What this draws is one marker per room, positioned from the coordinates the
 * map's own JSON records — normalised, so they hold at any size. The markers
 * are the slots the room icons will sit in.
 *
 * The parchment's first circle is labelled START — it is where the player
 * stands, not a room — so the rooms hang off the nodes after it: rooms[i] is
 * nodes[i + 1]. That first circle is home, and it is marked as where the player
 * currently is: lit, and not something to click.
 *
 * Only the next room can be entered (D3) — the one after the last the player
 * beat. It is drawn larger than the rest and pulses, so where to go next is
 * obvious without reading anything, and that treatment moves along the route as
 * rooms are beaten. Rooms already beaten keep their mark; rooms beyond the next
 * are dim, because they have not been reached.
 */

/** How much larger the next room is drawn than the rest. */
const NEXT_ROOM_SCALE = 1.4

/** Home is a landmark rather than a stop, so it is drawn well over node size. */
const HOME_SCALE = 1.9

export default function RunMap() {
  const dispatch = useDispatch()
  const nextRoomIndex = useSelector(selectNextRoomIndex)
  const map = resolveMap(roomData.map)

  if (!map) return null

  const { nodes, width, nodeRadius } = map.meta
  // The markers scale with the parchment, so the radius is a share of its width.
  const markerPercent = ((nodeRadius * 2) / width) * 100

  return (
    <main className="relative flex h-full w-full items-center justify-center overflow-hidden bg-soot-950">
      <MusicToggle className="absolute top-6 right-6 z-20" />

      {/* The wrapper is inline-block so it shrink-wraps the parchment exactly.
          The node coordinates below are fractions of the image, so the markers
          only land on the painted circles if this box IS the image — give it a
          shape of its own and the image letterboxes inside it, and every marker
          drifts. The cap is in viewport units because a percentage max-height
          against an auto-height box does not resolve. */}
      <div className="relative inline-block">
        <img src={map.url} alt="" className="block max-h-screen w-auto max-w-full" />

        {/* Home, on the first circle. A place the player is, not one they go to. */}
        <div
          title={`${roomData.start.name} — you are here`}
          style={{
            left: `${nodes[0].xNormalized * 100}%`,
            top: `${nodes[0].yNormalized * 100}%`,
            width: `${markerPercent * HOME_SCALE}%`,
            aspectRatio: '1',
            // drop-shadow, not a box-shadow on a round div: at this size the
            // castle is far wider than the circle painted underneath, so a
            // circular glow reads as a smudge behind it. This one follows the
            // silhouette, which is what marks home as where the player is.
            filter: 'drop-shadow(0 0 10px rgba(233,205,122,0.9))',
          }}
          className="-translate-x-1/2 -translate-y-1/2 absolute"
        >
          <RoomIcon src={resolveRoomIcon(roomData.start.icon)} name={roomData.start.name} />
        </div>

        {roomData.rooms.map((room, i) => {
          // nodes[0] is START; the rooms start at the node after it.
          const node = nodes[i + 1]
          if (!node) return null

          const icon = resolveRoomIcon(room.icon)
          const isNext = i === nextRoomIndex
          const isCleared = i < nextRoomIndex
          const position = {
            left: `${node.xNormalized * 100}%`,
            top: `${node.yNormalized * 100}%`,
            width: `${isNext ? markerPercent * NEXT_ROOM_SCALE : markerPercent}%`,
            aspectRatio: '1',
          }

          return isNext ? (
            <button
              key={room.id}
              type="button"
              onClick={() => dispatch(goTo('room'))}
              aria-label={`Enter ${room.name}`}
              style={{ ...position, animation: 'map-node-pulse 2.2s ease-in-out infinite' }}
              className={[
                '-translate-x-1/2 -translate-y-1/2 absolute cursor-pointer rounded-full',
                // Grows under the cursor and settles back when it leaves. This
                // sets `scale`, which the pulse's `transform` multiplies rather
                // than overrides.
                'transition-transform duration-200 ease-out hover:scale-125',
                'outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
                icon ? '' : 'border-2 border-gold-300 bg-gold-500/20',
              ].join(' ')}
            >
              {icon && <RoomIcon src={icon} name={room.name} />}
            </button>
          ) : (
            <div
              key={room.id}
              aria-hidden="true"
              title={room.name}
              style={position}
              className={[
                '-translate-x-1/2 -translate-y-1/2 absolute rounded-full',
                isCleared ? '' : 'border border-dashed border-soot-900/50',
              ].join(' ')}
            >
              {icon && <RoomIcon src={icon} name={room.name} dimmed={!isCleared} />}
            </div>
          )
        })}
      </div>
    </main>
  )
}

/**
 * The mark on a circle. Inset so it sits inside the ring painted on the
 * parchment rather than spilling over it — icons fill their own viewBox, and
 * the marker box is the circle's full diameter.
 *
 * Styling is left to the icon. They carry their own colour and shadow, and the
 * two in use already differ, so imposing one here would fight whichever came
 * second.
 */
function RoomIcon({ src, name, dimmed = false }) {
  return (
    <img
      src={src}
      alt=""
      title={name}
      className={['h-full w-full object-contain p-[9%]', dimmed ? 'opacity-40' : ''].join(' ')}
    />
  )
}
