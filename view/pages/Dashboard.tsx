export default function Dashboard ({ renderRoute }): React.ReactNode {
  return <div className="text-blue-500" onClick={() => renderRoute('Connections')}>bar</div>
}
