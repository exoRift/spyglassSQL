import type { renderRoute } from '../index'

export default function Dashboard ({ navigate, connection }: { navigate: typeof renderRoute, connection: number }): React.ReactNode {
  return connection
}
