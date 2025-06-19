import { Webview } from 'webview-bun'
import path from 'path'
import * as v from 'valibot'
import Knex from 'knex'

import * as logger from './lib/logger'

const Connection = v.object({
  environment: v.picklist(['local', 'testing', 'development', 'staging', 'production']),
  name: v.string(),
  username: v.string(),
  password: v.nullable(v.string()),
  host: v.string(),
  port: v.number(),
  database: v.string(),
  client: v.picklist(['pg', 'sqlite3', 'mysql', 'oracledb', 'tedious'])
})
type Connection = v.InferOutput<typeof Connection>

const Config = v.object({
  theme: v.optional(v.picklist(['system', 'light', 'dark']), 'system'),
  connections: v.optional(v.array(Connection), [])
})
type Config = v.InferOutput<typeof Config>

const CONFIG_LOCATION = path.resolve(process.cwd(), './spyglass.json')
logger.debug(CONFIG_LOCATION)
function loadConfig (): Promise<Config> {
  return Bun.file(CONFIG_LOCATION, { type: 'json' })
    .json()
    .then((obj) => v.parseAsync(Config, obj))
    .then((cfg) => {
      logger.info('Config loaded:', cfg)
      return cfg
    })
    .catch((err) => {
      logger.warn('Failed to load config. Using defaults...', err)
      return v.parse(Config, {})
    })
}

const config = await loadConfig()

/** View */
const webview = new Webview(process.env.NODE_ENV !== 'production')

const binds = {
  logInfo: logger.info,
  logWarn: logger.warn,
  logError: logger.error,
  logDebug: logger.debug,
  saveConfig (cfg: Config): Promise<number> {
    Object.assign(config, cfg)
    return Bun.write(CONFIG_LOCATION, JSON.stringify(config, null, 2))
  },
  async testConnection (options: Config['connections'][number] & { password: string }): Promise<boolean> {
    logger.debug('Installing:', options.client)
    await Bun.$`bun install ${options.client} --no-save`
      .then(() => logger.debug(options.client, 'installed'))
      .catch(() => logger.error(options.client, 'failed to install'))

    logger.debug('bruh')

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

    return await connection.raw('SELECT 1 as result')
      .then(() => true)
      .catch(() => false)
  }
} as const

for (const name in binds) {
  webview.bind(name, binds[name as keyof typeof binds])
}

type Promisify<T extends (...args: any[]) => any> = (...args: Parameters<T>) => Promise<ReturnType<T>>

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
if (process.env.NODE_ENV === 'production') {
  const { default: template } = await import('./view/dist/index.html', { with: { type: 'file' } })
  const compiled = await Bun.file(template).text()
  webview.init('window.addEventListener(\'contextmenu\', (e) => e.preventDefault(), { capture: true })')
  webview.setHTML(compiled)
  webview.run()
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
    webview.run()
  }, { once: true })
}
