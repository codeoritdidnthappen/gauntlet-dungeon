import { useSelector } from 'react-redux'
import { selectScreen } from './store/uiSlice'
import { MusicProvider } from './audio/MusicProvider'
import HomeScreen from './screens/HomeScreen'
import CharacterCreation from './screens/CharacterCreation'
import PetCreation from './screens/PetCreation'
import StartingLoadout from './screens/StartingLoadout'
import RunMap from './screens/RunMap'
import BattleRoom from './screens/BattleRoom'

/**
 * Screen routing.
 *
 * Flow (ARCHITECTURE.md §4):
 *   home -> [New Game]  -> creation -> pet -> cards -> entrance -> map
 *        -> [Continue]  -> map (never resumes mid-encounter)
 *
 * `entrance` does not exist yet, so screen 4 proceeds straight to the map, and
 * the map is where a room is entered from. The player is meant to return here
 * between fights; nothing sends them back yet, because no fight can end.
 *
 * The current screen lives in Redux because every screen navigates; screens
 * dispatch `goTo` themselves rather than being handed callbacks.
 *
 * MusicProvider wraps everything so the track survives screen changes instead
 * of restarting on each navigation.
 */
const SCREENS = {
  home: HomeScreen,
  creation: CharacterCreation,
  pet: PetCreation,
  cards: StartingLoadout,
  map: RunMap,
  room: BattleRoom,
}

export default function App() {
  const screen = useSelector(selectScreen)
  const Screen = SCREENS[screen] ?? HomeScreen

  return (
    <MusicProvider>
      <Screen />
    </MusicProvider>
  )
}
