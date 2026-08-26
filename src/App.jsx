import { useSelector } from 'react-redux'
import { selectScreen } from './store/uiSlice'
import { MusicProvider } from './audio/MusicProvider'
import HomeScreen from './screens/HomeScreen'
import CharacterCreation from './screens/CharacterCreation'
import PetCreation from './screens/PetCreation'
import StartingLoadout from './screens/StartingLoadout'
import BattleRoom from './screens/BattleRoom'

/**
 * Screen routing.
 *
 * Flow (ARCHITECTURE.md §4):
 *   home -> [New Game]  -> creation -> pet -> cards -> entrance -> map
 *        -> [Continue]  -> map (never resumes mid-encounter)
 *
 * `entrance` and `map` do not exist yet, so screen 4 currently proceeds
 * straight into `room` — the only way to reach the battle room, and better
 * than the self-navigation it replaced. Restore the documented flow once the
 * map is built.
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
