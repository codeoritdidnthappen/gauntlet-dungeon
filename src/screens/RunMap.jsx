import { useDispatch } from 'react-redux'
import roomData from '../../data/rooms.json'
import { resolveMap, resolveRoomIcon } from '../config/assets'
import MusicToggle from '../audio/MusicToggle'
import { goTo } from '../store/uiSlice'

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
 * Only the next room can be entered (D3). Rooms past it are drawn but inert,
 * because nothing behind them exists yet.
 */

/** Room 1 until a run tracks its own progress. */
const NEXT_ROOM_INDEX = 0

export default function RunMap() {
  const dispatch = useDispatch()
  const map = resolveMap(roomData.map)

  if (!map) return null

  const { nodes, width, nodeRadius } = map.meta
  // The markers scale with the parchment, so the radius is a share of its width.
  const markerSize = `${((nodeRadius * 2) / width) * 100}%`

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
            width: markerSize,
            aspectRatio: '1',
          }}
          className={[
            '-translate-x-1/2 -translate-y-1/2 absolute rounded-full',
            'bg-gold-300/35 shadow-[0_0_18px_6px_rgba(233,205,122,0.55)]',
          ].join(' ')}
        >
          <RoomIcon src={resolveRoomIcon(roomData.start.icon)} name={roomData.start.name} />
        </div>

        {roomData.rooms.map((room, i) => {
          // nodes[0] is START; the rooms start at the node after it.
          const node = nodes[i + 1]
          if (!node) return null

          const icon = resolveRoomIcon(room.icon)
          const isNext = i === NEXT_ROOM_INDEX
          const position = {
            left: `${node.xNormalized * 100}%`,
            top: `${node.yNormalized * 100}%`,
            width: markerSize,
            aspectRatio: '1',
          }

          return isNext ? (
            <button
              key={room.id}
              type="button"
              onClick={() => dispatch(goTo('room'))}
              aria-label={`Enter ${room.name}`}
              style={position}
              className={[
                '-translate-x-1/2 -translate-y-1/2 absolute cursor-pointer rounded-full',
                // Grows under the cursor and settles back when it leaves.
                'transition-transform duration-200 ease-out hover:scale-150',
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
              className="-translate-x-1/2 -translate-y-1/2 absolute rounded-full border border-dashed border-soot-900/50"
            >
              {icon && <RoomIcon src={icon} name={room.name} dimmed />}
            </div>
          )
        })}
      </div>
    </main>
  )
}

/**
 * The mark on a room's circle. Drawn as ink on the parchment rather than a UI
 * element, so it belongs to the map instead of sitting on top of it.
 */
function RoomIcon({ src, name, dimmed = false }) {
  return (
    <img
      src={src}
      alt=""
      title={name}
      className={[
        'h-full w-full object-contain drop-shadow-[0_1px_2px_rgba(255,240,200,0.55)]',
        dimmed ? 'opacity-40' : '',
      ].join(' ')}
    />
  )
}
