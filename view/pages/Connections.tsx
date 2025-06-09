export default function Connections ({ renderRoute }): React.ReactNode {
  return <h1 className='text-red-500' onClick={() => renderRoute('Dashboard')}>foo</h1>
}
