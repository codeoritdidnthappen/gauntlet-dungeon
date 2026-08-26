import { useDispatch } from 'react-redux'
import roomData from '../../data/rooms.json'
import { resolveMap } from '../config/assets'
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

        {roomData.rooms.map((room, i) => {
          const node = nodes[i]
          if (!node) return null

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
                'border-2 border-gold-300 bg-gold-500/20',
                'transition-colors duration-150 outline-none',
                'hover:bg-gold-500/40 focus-visible:ring-2 focus-visible:ring-gold-400',
              ].join(' ')}
            />
          ) : (
            <div
              key={room.id}
              aria-hidden="true"
              title={room.name}
              style={position}
              className="-translate-x-1/2 -translate-y-1/2 absolute rounded-full border border-dashed border-soot-900/50"
            />
          )
        })}
      </div>
    </main>
  )
}
