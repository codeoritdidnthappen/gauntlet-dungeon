import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { readResumePoint, startAutosave } from './save/persistence'
import { hydratePlayer } from './store/playerSlice'
import { goTo } from './store/uiSlice'
import './index.css'
import App from './App.jsx'

/**
 * The save is read before the first render, so a reload never flashes the
 * welcome screen on its way to where the player actually was. Reading it costs
 * an HMAC verification, which is async — hence the promise around the render.
 *
 * A missing or unverifiable save simply resolves to nothing, and the game opens
 * on the welcome screen as it always did.
 */
readResumePoint()
  .catch(() => null)
  .then((resume) => {
    if (resume) {
      store.dispatch(hydratePlayer(resume.character))
      store.dispatch(goTo(resume.screen))
    }

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
