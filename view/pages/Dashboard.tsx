import { useCallback, useEffect, useMemo, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import type { renderRoute } from '../index'

import { type Layout, type WidgetProps, Dashboard as Dash } from 'dashup'
import { Alert, Button, Drawer, Form, Input, Modal, Select } from 'react-daisyui'
import type { Chart } from '../../lib/config'

import { MdArrowLeft, MdCable, MdDelete, MdDragHandle, MdSave, MdWarning } from 'react-icons/md'
import 'dashup/style.css'

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
  const [tables, setTables] = useState<Awaited<ReturnType<typeof getTables>>>({})

  const [password, setPassword] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()

  const charts = useMemo(() =>
    connection.charts.map<WidgetProps>((c, i) => ({
      id: i.toString(),
      ...c.pos,
      component: (
        <Chart
          onContextMenu={(e) => {
            e.preventDefault()
            setEditing(i)

            const lastEdited = document.querySelectorAll('[data-last-edited]')
            lastEdited.forEach((w) => w.toggleAttribute('data-last-edited', false))

            const widget = e.currentTarget.closest('.dashup-widget')!
            widget.toggleAttribute('data-editing', true)
            widget.toggleAttribute('data-last-edited', true)
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
      xColumn: null,
      yTitle: 'untitled y',
      yColumn: null,
      type: 'line',
      table: null
    })
    setSignal((prior) => prior + 1)
    setIsUnsaved(true)
  }, [connection])

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
  }, [connection])

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

  const connect = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const pw = (data.get('password') as string | null) ?? ''

    setPasswordError(undefined)
    void testConnection({
      ...connection,
      password: pw
    })
      .then((r) => {
        if (r === null) setPasswordError('Could not connect. Is the password incorrect?')
        else setPassword(pw)
      })
  }, [connection])

  useEffect(() => {
    if (connection.password !== undefined || password !== undefined) {
      void setActiveConnection(connIndex, password)
        .then(getTables)
        .then(setTables)
    }
  }, [connection, connIndex, password])

  const editedChart = editing === null ? null : connection.charts[editing]!

  function editChart<T extends keyof Chart> (field: T, value: Chart[T]): void {
    if (editedChart) {
      editedChart[field] = value
      setIsUnsaved(true)
    }
  }

  return (
    <div className='flex flex-col w-screen h-screen'>
      <Alert className={twMerge('transition fixed left-2 bottom-2 translate-y-4 opacity-0 z-50', tables === null && 'opacity-100 translate-y-0')} icon={<MdWarning className='text-warning text-lg' />}>Spyglass cannot connect to the database</Alert>

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

      <div className='h-0 grow overflow-auto [&_[data-last-edited]]:!z-20' onDoubleClick={createWidget}>
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
                <Input defaultValue={editedChart.title} onChange={(e) => editChart('title', e.currentTarget.value)} className='w-full' id='title' name='title' />
              </div>

              <div className='fieldset w-full'>
                <label htmlFor='table' className='label'>
                  <span className='label-text'>Table</span>
                </label>
                <Select defaultValue={editedChart.table ?? ''} onChange={(e) => editChart('table', e.currentTarget.value)} className='w-full' id='table' name='table'>
                  <Select.Option value='' disabled>Choose a Table</Select.Option>

                  {tables && Object.keys(tables).map((t) => (
                    <Select.Option value={t} key={t}>{t}</Select.Option>
                  )) as any}
                </Select>
              </div>

              <div className='fieldset w-full'>
                <label htmlFor='type' className='label'>
                  <span className='label-text'>Chart Type</span>
                </label>
                <Select defaultValue={editedChart.type} onChange={(e) => editChart('type', e.currentTarget.value as Chart['type'])} className='w-full' id='type' name='type'>
                  <Select.Option value='bar'>Bar</Select.Option>
                  <Select.Option value='line'>Line</Select.Option>
                  <Select.Option value='pie'>Pie</Select.Option>
                </Select>
              </div>

              <div className='flex gap-4 *:grow'>
                <div className='fieldset w-full'>
                  <label htmlFor='xTitle' className='label'>
                    <span className='label-text'>X Axis Title</span>
                  </label>
                  <Input defaultValue={editedChart.xTitle} onChange={(e) => editChart('xTitle', e.currentTarget.value)} className='w-full' id='xTitle' name='xTitle' />
                </div>

                <div className='fieldset w-full'>
                  <label htmlFor='table' className='label'>
                    <span className='label-text'>X Axis Column</span>
                  </label>
                  <Select disabled={!editedChart.table} defaultValue={editedChart.xColumn ?? ''} onChange={(e) => editChart('xColumn', e.currentTarget.value)} className='w-full' id='xColumn' name='xColumn'>
                    <Select.Option value='' disabled>Choose a column</Select.Option>

                    {tables && tables[editedChart.table ?? '']?.map((c) => (
                      <Select.Option value={c.name} key={c.name}>{c.name}</Select.Option>
                    )) as any}
                  </Select>
                </div>
              </div>

              <div className='flex gap-4 *:grow'>
                <div className='fieldset w-full'>
                  <label htmlFor='yTitle' className='label'>
                    <span className='label-text'>Y Axis Title</span>
                  </label>
                  <Input defaultValue={editedChart.yTitle} onChange={(e) => editChart('yTitle', e.currentTarget.value)} className='w-full' id='yTitle' name='yTitle' />
                </div>

                <div className='fieldset w-full'>
                  <label htmlFor='table' className='label'>
                    <span className='label-text'>Y Axis Column</span>
                  </label>
                  <Select disabled={!editedChart.table} defaultValue={editedChart.yColumn ?? ''} onChange={(e) => editChart('yColumn', e.currentTarget.value)} className='w-full' id='yColumn' name='yColumn'>
                    <Select.Option value='' disabled>Choose a column</Select.Option>

                    {tables && tables[editedChart.table ?? '']?.map((c) => (
                      <Select.Option value={c.name} key={c.name}>{c.name}</Select.Option>
                    )) as any}
                  </Select>
                </div>
              </div>

              <div className='fieldset w-full'>
                <label htmlFor='where' className='label'>
                  <span className='label-text'>Filter</span>
                </label>
                <Input placeholder='Raw SQL WHERE Clause...' defaultValue={editedChart.where} onChange={(e) => editChart('where', e.currentTarget.value)} className='w-full' id='where' name='where' />
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

      <Modal open={connection.password === undefined && password === undefined}>
        <Modal.Header>
          <span>Enter a password to access </span>
          <strong>{connection.name}</strong>
        </Modal.Header>

        <Modal.Body>
          <Form id='password_form' onSubmit={connect}>
            <div className='fieldset'>
              <Input placeholder='Enter Password...' name='password' id='password' type='password' className='w-full' />
              {passwordError && <label htmlFor='password' className='label text-error'>{passwordError}</label>}
            </div>
          </Form>
        </Modal.Body>

        <Modal.Actions>
          <Button type='button' form='password_form' onClick={() => navigate('Connections', {})}>
            Cancel
          </Button>

          <Button color='primary' type='submit' form='password_form'>
            <MdCable className='text-xl' />
            Connect
          </Button>
        </Modal.Actions>
      </Modal>

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
