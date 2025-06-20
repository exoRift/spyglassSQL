import { Webview } from 'webview-bun'
import path from 'path'
import { type } from 'arktype'
import Knex from 'knex'

import * as logger from './lib/logger'

const Connection = type({
  environment: '"local" | "testing" | "development" | "staging" | "production"',
  name: 'string',
  username: 'string',
  'password?': 'string',
  host: 'string',
  'port?': type.or('number | string.numeric.parse', type('""').pipe(() => undefined)),
  database: 'string',
  client: '"pg" | "sqlite3" | "mysql" | "oracledb" | "tedious"'
})
export type Connection = typeof Connection.infer

const Config = type({
  theme: type('"system" |  "light" | "dark"').default('system'),
  connections: Connection.array().default(() => [])
})
export type Config = typeof Config.infer

const CONFIG_LOCATION = path.resolve(process.cwd(), './spyglass.json')
logger.debug(CONFIG_LOCATION)
function loadConfig (): Promise<Config> {
  return Bun.file(CONFIG_LOCATION, { type: 'json' })
    .json()
    .then((obj) => Config(obj))
    .then((cfg) => {
      if (cfg instanceof type.errors) throw cfg.toTraversalError()
      logger.info('Config loaded:', cfg)
      return cfg
    })
    .catch((err) => {
      logger.warn('Failed to load config. Using defaults...', err)
      return Config({}) as Config
    })
}

const config = await loadConfig()

/** View */
const webview = new Webview(process.env.NODE_ENV !== 'production')

function moduleExists (name: string): boolean {
  try {
    Bun.resolveSync(name, import.meta.dirname)
    return true
  } catch {
    return false
  }
}

const binds = {
  logInfo: logger.info,
  logWarn: logger.warn,
  logError: logger.error,
  logDebug: logger.debug,
  async saveConfig (cfg: Config): Promise<null | type.errors> {
    const parsed = Config(cfg)
    if (parsed instanceof type.errors) return parsed
    Object.assign(config, parsed)
    logger.debug(config)
    return await Bun.write(CONFIG_LOCATION, JSON.stringify(config, null, 2))
      .then(() => null)
  },
  async testConnection (options: Connection & { password: string }): Promise<number | null> {
    const installed = moduleExists(options.client)

    if (!installed) {
      logger.debug('Installing:', options.client)
      await Bun.$`bun install ${options.client} --no-save`
        .then(() => logger.debug(options.client, 'installed'))
        .catch(() => logger.error(options.client, 'failed to install'))
    }

    const connection = Knex({
      client: options.client,
      connection: {
        user: options.username,
        password: options.password,
        host: options.host,
        port: options.port,
        database: options.database
      }
    })

    const ts = performance.now()
    return await connection.raw('SELECT 1 as result')
      .then(() => performance.now() - ts)
      .catch(() => null)
  }
} as const

for (const name in binds) {
  webview.bind(name, binds[name as keyof typeof binds])
}

type Promisify<T extends (...args: any[]) => any> = (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>

/* eslint-disable no-var */
declare global {
  var config: Config
  var logInfo: Promisify<typeof binds.logInfo>
  var logWarn: Promisify<typeof binds.logWarn>
  var logError: Promisify<typeof binds.logError>
  var logDebug: Promisify<typeof binds.logDebug>
  var saveConfig: Promisify<typeof binds.saveConfig>
  var testConnection: Promisify<typeof binds.testConnection>
}
/* eslint-enable no-var */

webview.title = 'SpyglassSQL'
webview.init(`var config = ${JSON.stringify(config)}`)
webview.init(`
const originalInfo = console.info
const originalError = console.error
const originalWarn = console.warn
const originalDebug = console.debug
console.info = (...args) => {
  void logInfo(...args)
  originalInfo(...args)
}
console.error = (...args) => {
  void logError(...args)
  originalError(...args)
}
console.warn = (...args) => {
  void logWarn(...args)
  originalWarn(...args)
}
console.debug = (...args) => {
  void logDebug(...args)
  originalDebug(...args)
}
`)
if (process.env.NODE_ENV === 'production') {
  const { default: template } = await import('./view/dist/index.html', { with: { type: 'file' } })
  const compiled = await Bun.file(template).text()
  webview.init('window.addEventListener(\'contextmenu\', (e) => e.preventDefault(), { capture: true })')
  webview.setHTML(compiled)
  webview.runNonBlocking()
} else {
  const worker = new Worker(Bun.resolveSync('./lib/dev/server', import.meta.dir))

  worker.addEventListener('error', (e) => {
    logger.error('Worker Error:', e.message)
    process.exit(1)
  })

  worker.addEventListener('message', (e) => {
    const url: string = e.data

    logger.debug('Vite running on URL:', url)
    if (!url) throw Error('Unexpected: Vite did not return a local address')
    webview.navigate(url)
    webview.runNonBlocking()
  }, { once: true })
}
