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

// window.config = {
//   "connections": [
//     {
//       "name": "Testing",
//       "environment": "testing",
//       "username": "arthur",
//       "password": "",
//       "host": "localhost",
//       "database": "spyglass",
//       "client": "pg",
//       "savepass": "on",
//       "charts": []
//     }
//   ],
//   "theme": "system"
// }

document.body.setAttribute('data-theme', config.theme)

export function renderRoute<R extends keyof typeof VIEWS> (route: R, props: Omit<React.ComponentProps<(typeof VIEWS)[R]>, 'navigate'>): void {
  const View = VIEWS[route] as React.FunctionComponent<any>

  root.render(<View navigate={renderRoute} {...props} />)
}

renderRoute('Connections', {})
