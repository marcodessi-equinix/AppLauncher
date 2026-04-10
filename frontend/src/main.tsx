import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initializeAppVersion } from './lib/version'

const rootEl = document.getElementById('root')

if (!rootEl) {
  throw new Error('Root element #root not found.')
}

const bootstrap = async () => {
  try {
    const [{ default: App }] = await Promise.all([
      import('./App'),
      initializeAppVersion(),
    ])

    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('Frontend bootstrap failed:', error)
    rootEl.textContent = 'Application failed to start. Check the browser console.'
  }
}

void bootstrap()
