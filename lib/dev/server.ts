const { createServer } = await import('vite')

const server = await createServer({
  root: 'view'
})
await server.listen()

const url = server.resolvedUrls?.local[0]

self.postMessage(url)
