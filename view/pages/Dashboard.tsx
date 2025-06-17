import type { renderRoute } from '../index'

export default function Dashboard ({ navigate }: { navigate: typeof renderRoute }): React.ReactNode {
  return <div className='text-blue-500' onClick={() => navigate('Connections')}>bar</div>
}
