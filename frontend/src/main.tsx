import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const rootEl = document.getElementById('root')

if (!rootEl) {
  throw new Error('Root element #root not found.')
}

const hasRuntimeConfig = (): boolean =>
  typeof window.RUNTIME_CONFIG?.API_URL === 'string' &&
  window.RUNTIME_CONFIG.API_URL.trim().length > 0

const loadRuntimeConfigScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `/runtime-config.js?t=${Date.now()}`
    script.async = false
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load /runtime-config.js'))
    document.head.appendChild(script)
  })

const ensureRuntimeConfig = async (): Promise<void> => {
  if (hasRuntimeConfig()) return
  await loadRuntimeConfigScript()
  if (!hasRuntimeConfig()) {
    throw new Error('window.RUNTIME_CONFIG.API_URL is missing after runtime-config.js load.')
  }
}

const showBootstrapError = (message: string) => {
  rootEl.textContent = message
}

const bootstrap = async () => {
  try {
    await ensureRuntimeConfig()
    const { default: App } = await import('./App')

    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('Frontend bootstrap aborted:', error)
    showBootstrapError('Runtime configuration could not be loaded. App start blocked.')
  }
}

void bootstrap()
