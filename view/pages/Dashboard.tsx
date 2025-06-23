import { useCallback, useEffect, useMemo, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import type { renderRoute } from '../index'

import { type Layout, type WidgetProps, Dashboard as Dash } from 'dashup'
import { Button, Drawer, Input, Modal } from 'react-daisyui'

import 'dashup/style.css'
import { MdArrowLeft, MdDelete, MdDragHandle, MdSave } from 'react-icons/md'

function Chart ({ className, onContextMenu }: Pick<React.ComponentProps<'div'>, 'className' | 'onContextMenu'>): React.ReactNode {
  return (
    <>
      <div className='transition-opacity absolute inset-x-0 flex justify-center bg-base-200 handle cursor-grab opacity-0 [.dashup-widget:hover_&]:opacity-100 [.dashup-widget[data-editing]_&]:hidden'>
        <MdDragHandle />
      </div>

      <div className={twMerge('bg-blue-500 h-full', className)} onContextMenu={onContextMenu}>moment</div>
    </>
  )
}

export default function Dashboard ({ navigate, connection: connIndex }: { navigate: typeof renderRoute, connection: number }): React.ReactNode {
  const connection = config.connections[connIndex]!

  const {
    Dialog: UnsavedDialog,
    handleShow: promptUnsaved
  } = Modal.useDialog()

  const [signal, setSignal] = useState(0)
  const [isUnsaved, setIsUnsaved] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)

  const charts = useMemo(() =>
    connection.charts.map<WidgetProps>((c, i) => ({
      id: i.toString(),
      ...c.pos,
      component: (
        <Chart
          onContextMenu={(e) => {
            e.preventDefault()
            setEditing(i)
            const widget = e.currentTarget.closest('.dashup-widget')!
            widget.toggleAttribute('data-editing', true)
          }}
        />
      ),
      draggable: true,
      resizable: true,
      dragHandleClassName: 'handle',
      minWidth: 10,
      minHeight: 10,
      maxWidth: 100
    }))
  , [signal, connection])

  const createWidget = useCallback((e: React.MouseEvent) => {
    const x = Math.min(Math.round(e.clientX / e.currentTarget.clientWidth * 100), 100 - 30)
    const y = Math.round(e.clientY / e.currentTarget.clientHeight * 50)

    connection.charts.push({
      pos: {
        x,
        y,
        width: 30,
        height: 30
      },
      title: 'untitled',
      xTitle: 'untiled x',
      yTitle: 'untitled y',
      type: 'line',
      table: null
    })
    setSignal((prior) => prior + 1)
    setIsUnsaved(true)
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
      setIsUnsaved(true)
    }
  }, [])

  const save = useCallback(() => {
    void saveConfig(config)
      .then(() => setIsUnsaved(false))
  }, [])

  const restoreConfig = useCallback(() => {
    void getConfig()
      .then((cfg) => { config = cfg })
      .then(() => setIsUnsaved(false))
      .then(() => setSignal((prior) => prior + 1))
  }, [])

  const editedChart = editing === null ? null : connection.charts[editing]!

  return (
    <div className='flex flex-col w-screen h-screen'>
      <header className='flex gap-4 items-center bg-base-300 transition-colors duration-300 p-2 px-4'>
        <Button variant='link' className='text-primary px-0' onClick={() => isUnsaved ? promptUnsaved() : navigate('Connections', {})}>
          <MdArrowLeft className='text-xl' />
          Back
        </Button>

        <Button onClick={save} color='secondary' className={twMerge('transition opacity-0 ml-auto pointer-events-none', isUnsaved && 'animate-pulse opacity-100 pointer-events-auto')}>
          <MdSave className='text-xl' />
          Save
        </Button>
      </header>

      <div className='h-0 grow overflow-auto [&_[data-editing]]:!z-20' onDoubleClick={createWidget}>
        <div className={twMerge('transition', editing !== null && '-translate-x-48')}>
          <Dash widgets={charts} packing columns={100} rowHeight={1} placeholderClassName='bg-blue-200' onChange={updateWidgets} />
          <div className={twMerge('transition fixed inset-0 bg-black opacity-0 z-10 pointer-events-none', editing !== null && 'opacity-30')} />
        </div>
      </div>

      <Drawer
        open={editing !== null}
        side={editedChart
          ? (
            <div className='w-96 h-screen bg-base-200 p-6'>
              <h1 className='text-2xl font-bold mb-4'>Edit Chart</h1>

              <div className='fieldset w-full'>
                <label htmlFor='title' className='label'>
                  <span className='label-text'>Title</span>
                </label>
                <Input defaultValue={editedChart.title} onChange={(e) => { editedChart.title = e.currentTarget.value }} className='w-full' id='title' name='title' />
              </div>
            </div>
          )
          : null}
        sideClassName='z-30'
        overlayClassName='!bg-transparent'
        onClickOverlay={() => {
          const widgets = document.querySelectorAll('[data-editing]')
          widgets.forEach((w) => w.toggleAttribute('data-editing', false))
          setEditing(null)
        }}
        end
      />

      <UnsavedDialog backdrop>
        <Modal.Header>
          You have unsaved changes
        </Modal.Header>

        <Modal.Body>
          <p>You can't exit while you have unsaved changes</p>
        </Modal.Body>

        <Modal.Actions>
          <Button color='error' onClick={restoreConfig}>
            <MdDelete className='text-xl' />
            Discard Changes
          </Button>
          <Button color='success' onClick={save}>
            <MdSave className='text-xl' />
            Save Changes
          </Button>
        </Modal.Actions>
      </UnsavedDialog>
    </div>
  )
}
