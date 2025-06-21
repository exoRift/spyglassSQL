import { useCallback, useMemo, useState } from 'react'
import type { renderRoute } from '../index'

import { type Layout, type WidgetProps, Dashboard as Dash } from 'dashup'

import 'dashup/style.css'
import { MdArrowLeft, MdDragHandle } from 'react-icons/md'
import { Button } from 'react-daisyui'

function Chart (): React.ReactNode {
  return (
    <>
      <div className='transition-opacity absolute inset-x-0 flex justify-center bg-base-200 toolbar cursor-grab opacity-0 [.dashup-widget:hover_&]:opacity-100'>
        <MdDragHandle />
      </div>

      <div className='bg-blue-500 h-full'>moment</div>
    </>
  )
}

export default function Dashboard ({ navigate, connection: connIndex }: { navigate: typeof renderRoute, connection: number }): React.ReactNode {
  const connection = config.connections[connIndex]!

  const [signal, setSignal] = useState(0)

  const charts = useMemo(() =>
    connection.charts.map<WidgetProps>((c, i) => ({
      id: i.toString(),
      ...c.pos,
      component: <Chart />,
      draggable: true,
      resizable: true,
      dragHandleClassName: 'toolbar',
      minWidth: 10,
      minHeight: 10,
      maxWidth: 100
    }))
  , [signal, connection])

  const createWidget = useCallback((e: React.MouseEvent) => {
    const x = e.clientX / e.currentTarget.clientWidth * 100
    const y = e.clientY / e.currentTarget.clientHeight * 50

    connection.charts.push({
      pos: {
        x,
        y,
        width: 20,
        height: 20
      },
      title: 'untitled',
      xTitle: 'untiled x',
      yTitle: 'untitled y',
      type: 'line',
      table: null
    })
    setSignal((prior) => prior + 1)
  }, [])

  const updateWidgets = useCallback((widgets: Layout) => {
    for (let w = 0; w < widgets.length; ++w) {
      const widget = widgets[w]!

      const newPos = {
        x: widget.x,
        y: widget.y,
        width: widget.width,
        height: widget.height
      }

      Object.assign(connection.charts[w]!.pos, newPos)
      setSignal((prior) => prior + 1)
    }
  }, [])

  return (
    <div className='flex flex-col w-screen h-screen'>
      <header className='flex gap-4 items-center bg-base-300 transition-colors duration-300 p-2'>
        <Button variant='link' className='text-secondary' onClick={() => navigate('Connections', {})}>
          <MdArrowLeft className='text-xl' />
          Back
        </Button>
      </header>

      <div className='grow' onDoubleClick={createWidget}>
        <Dash widgets={charts} packing columns={100} rowHeight={1} placeholderClassName='bg-blue-200' onChange={updateWidgets} />
      </div>
    </div>
  )
}
