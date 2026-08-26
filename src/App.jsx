import { useState } from 'react'
import { MusicProvider } from './audio/MusicProvider'
import HomeScreen from './screens/HomeScreen'
import CharacterCreation from './screens/CharacterCreation'
import PetCreation from './screens/PetCreation'

/**
 * Screen routing.
 *
 * Flow (ARCHITECTURE.md §4):
 *   home -> [New Game]  -> creation -> pet -> cards -> entrance -> map
 *        -> [Continue]  -> map (never resumes mid-encounter)
 *
 * MusicProvider wraps everything so the track survives screen changes instead
 * of restarting on each navigation.
 */
export default function App() {
  const [screen, setScreen] = useState('home')
  // Accumulated across the creation screens until Screen 4 (cards) exists.
  const [character, setCharacter] = useState(null)

  const screens = {
    creation: (
      <CharacterCreation
        onBack={() => setScreen('home')}
        onConfirm={(next) => {
          setCharacter(next)
          setScreen('pet')
        }}
      />
    ),
    pet: (
      <PetCreation
        onBack={() => setScreen('creation')}
        onConfirm={(next) => setCharacter({ ...character, ...next })}
      />
    ),
    home: (
      <HomeScreen
        onNewGame={() => setScreen('creation')}
        onContinue={() => setScreen('creation')}
      />
    ),
  }

  return <MusicProvider>{screens[screen] ?? screens.home}</MusicProvider>
}
