import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { readSavedCharacter, startAutosave } from './save/persistence'
import { hydratePlayer } from './store/playerSlice'
import './index.css'
import App from './App.jsx'

/**
 * The save is read before the first render, so the welcome screen already knows
 * whether there is a game to continue by the time it draws. Reading it costs an
 * HMAC verification, which is async — hence the promise around the render.
 *
 * The game always opens on the welcome screen; only the character is restored.
 * Continuing from there is the player's choice to make.
 */
readSavedCharacter()
  .catch(() => null)
  .then((character) => {
    if (character) store.dispatch(hydratePlayer(character))

    // Only after restoring, or the restore would immediately save itself back.
    startAutosave(store)

    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </StrictMode>,
    )
  })
