import type { renderRoute } from '../index'

import { Badge, Button, Modal, Table } from 'react-daisyui'

import logo from '../../assets/logo.png'
import { MdAdd, MdBuild } from 'react-icons/md'

function envToBadge (env: (typeof config.connections)[number]['environment']): React.ReactElement {
  switch (env) {
    case 'local': return <Badge variant='outline' color='neutral'>{env}</Badge>
    case 'test': return <Badge color='success'>{env}</Badge>
    case 'dev': return <Badge color='warning'>{env}</Badge>
    case 'staging': return <Badge variant='outline' color='info'>{env}</Badge>
    case 'prod': return <Badge color='error'>{env}</Badge>
  }
}

function ConnectionCreateButton (): React.ReactNode {
  const {
    Dialog,
    handleShow,
    handleHide
  } = Modal.useDialog()

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
          bruh
        </Modal.Body>

        <Modal.Actions>
          <Button className='mr-auto' color='neutral'>
            <MdBuild className='text-xl' />
            Test Connection
          </Button>

          <Button variant='outline' onClick={handleHide}>Cancel</Button>
          <Button color='success'>Save</Button>
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
