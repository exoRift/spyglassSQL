import type { renderRoute } from '../index'

import { Badge, Button, Form, Input, Modal, Select, Table } from 'react-daisyui'

import logo from '../../assets/logo.png'
import { MdAdd, MdBuild } from 'react-icons/md'
import { useCallback } from 'react'

function envToBadge (env: (typeof config.connections)[number]['environment']): React.ReactElement {
  switch (env) {
    case 'local': return <Badge variant='outline' color='neutral'>{env}</Badge>
    case 'testing': return <Badge color='success'>{env}</Badge>
    case 'development': return <Badge color='warning'>{env}</Badge>
    case 'staging': return <Badge variant='outline' color='info'>{env}</Badge>
    case 'production': return <Badge color='error'>{env}</Badge>
  }
}

function ConnectionCreateButton (): React.ReactNode {
  const {
    Dialog,
    handleShow,
    handleHide
  } = Modal.useDialog()

  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const mode = (e.nativeEvent as SubmitEvent).submitter!.id
    const data = new FormData(e.currentTarget)

    switch (mode) {
      case 'test':
        testConnection(Object.fromEntries(data.entries()) as any)
      case 'submit':
    }
  }, [])

  return (
    <>
      <Button color='primary' onClick={handleShow}>
        <MdAdd className='text-xl' />
        New Connection
      </Button>

      <Dialog>
        <Modal.Header>
          <h1 className='font-bold'>Create New Connection</h1>
        </Modal.Header>

        <Modal.Body>
          <Form id='create' className='space-y-4' onSubmit={onSubmit}>
            <div className='flex gap-4 *:grow'>
              <div className='fieldset w-full'>
                <label htmlFor='name' className='label'>
                  <span className='label-text'>Connection Name</span>
                </label>
                <Input className='w-full' id='name' name='name' required />
                <label htmlFor='name' className='label'>
                  <span className='label-text'>This is unrelated to the connection URL</span>
                </label>
              </div>

              <div className='fieldset w-max'>
                <label htmlFor='environment' className='label'>
                  <span className='label-text'>Environment</span>
                </label>
                <Select className='w-full' id='environment' name='environment' required>
                  <Select.Option value='local'>Local</Select.Option>
                  <Select.Option value='testing'>Testing</Select.Option>
                  <Select.Option value='development'>Development</Select.Option>
                  <Select.Option value='staging'>Staging</Select.Option>
                  <Select.Option value='production'>Production</Select.Option>
                </Select>
                <label htmlFor='environment' className='label'>
                  <span className='label-text'>This is unrelated to the connection URL</span>
                </label>
              </div>
            </div>

            <div className='flex gap-4 *:grow'>
              <div className='fieldset'>
                <label htmlFor='username' className='label'>
                  <span className='label-text'>Username</span>
                </label>
                <Input id='username' name='username' required />
              </div>

              <div className='fieldset'>
                <label htmlFor='password' className='label'>
                  <span className='label-text'>Password</span>
                </label>
                <Input id='password' name='password' type='password' />
                <label htmlFor='password' className='label'>
                  <span className='label-text'>If left blank, password will be prompted on connect</span>
                </label>
              </div>
            </div>

            <div className='flex gap-4 *:grow'>
              <div className='fieldset w-full'>
                <label htmlFor='host' className='label'>
                  <span className='label-text'>Host</span>
                </label>
                <Input className='w-full' id='host' name='host' required />
              </div>

              <div className='fieldset w-1/2'>
                <label htmlFor='port' className='label'>
                  <span className='label-text'>Port</span>
                </label>
                <Input className='w-full' id='port' name='port' />
              </div>

              <div className='fieldset w-full'>
                <label htmlFor='database' className='label'>
                  <span className='label-text'>Database</span>
                </label>
                <Input className='w-full' id='database' name='database' required />
              </div>
            </div>

            <div className='fieldset w-max'>
              <label htmlFor='client' className='label'>
                <span className='label-text'>SQL Client</span>
              </label>
              <Select className='w-full' id='client' name='client' required>
                <Select.Option value='pg'>pg</Select.Option>
                <Select.Option value='sqlite3'>sqlite3</Select.Option>
                <Select.Option value='mysql'>mysql (MariaDB-compatible)</Select.Option>
                <Select.Option value='oracledb'>oracledb</Select.Option>
                <Select.Option value='tedious'>tedious (MSSQL)</Select.Option>
              </Select>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Actions>
          <Button id='test' className='mr-auto' color='neutral' type='submit' form='create'>
            <MdBuild className='text-xl' />
            Test Connection
          </Button>

          <Button variant='outline' onClick={handleHide} type='button'>Cancel</Button>
          <Button id='submit' color='success' type='submit' form='create'>Save</Button>
        </Modal.Actions>
      </Dialog>
    </>
  )
}

export default function Connections ({ navigate }: { navigate: typeof renderRoute }): React.ReactNode {
  return (
    <>
      <header className='flex gap-4 items-center bg-base-300 transition-colors duration-300 p-2'>
        <img src={logo} alt='SpyglassSQL' className='size-12' />

        <h1 className='text-secondary text-2xl font-bold'>Spyglass SQL</h1>
      </header>

      <div className='p-8 space-y-4'>
        <h2 className='text-neutral-content font-semibold text-xl'>Connections</h2>

        <Table>
          <Table.Head>
            <span>Env</span>
            <span>Name</span>
            <span>User</span>
            <span>Database</span>
            <span>DB Client</span>
          </Table.Head>
          <Table.Body>
            {config.connections.map((c) => (
              <Table.Row key={c.name}>
                {envToBadge(c.environment)}
                <span>{c.name}</span>
                <span>{c.username}</span>
                <span>{c.database}</span>
                <code>{c.client}</code>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        <ConnectionCreateButton />
      </div>
    </>
  )
}
