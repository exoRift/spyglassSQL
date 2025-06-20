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

export function renderRoute<R extends keyof typeof VIEWS> (route: R, props: Omit<React.ComponentProps<(typeof VIEWS)[R]>, 'navigate'>): void {
  const View = VIEWS[route] as React.FunctionComponent<any>

  root.render(<View navigate={renderRoute} {...props} />)
}

renderRoute('Connections', {})
