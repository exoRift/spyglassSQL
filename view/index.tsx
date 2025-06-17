import { createRoot } from 'react-dom/client'

import Connections from './pages/Connections'
import Dashboard from './pages/Dashboard'

import './styles/index.css'

const container = document.getElementById('root') as HTMLDivElement
const root = createRoot(container)

const VIEWS = {
  Connections,
  Dashboard
}

document.body.setAttribute('data-theme', config.theme)
window.addEventListener('error', (e) => { void logError('Webview Runtime Error:', e.message) }, { passive: true })

export function renderRoute (route: keyof typeof VIEWS, props?: object): void {
  const View = VIEWS[route]

  root.render(<View navigate={renderRoute} {...props} />)
}

renderRoute('Connections')
