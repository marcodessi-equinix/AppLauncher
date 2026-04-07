import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const rootEl = document.getElementById('root')

if (!rootEl) {
  throw new Error('Root element #root not found.')
}

const bootstrap = async () => {
  try {
    const { default: App } = await import('./App')

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
