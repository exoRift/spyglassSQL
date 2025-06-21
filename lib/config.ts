import { type } from 'arktype'

const Join = type({
  table: 'string',
  baseColumn: 'string',
  foreignColumn: 'string'
})

const Chart = type({
  pos: {
    x: 'number',
    y: 'number',
    width: 'number',
    height: 'number'
  },
  title: 'string',
  xTitle: 'string',
  yTitle: 'string',
  type: '"bar" | "line" | "pie"',
  table: 'string | null',
  'joins?': Join.array(),
  'where?': 'string',
  'map?': 'string',
  'xFormatter?': 'string',
  'yFormatter?': 'string'
})

const Connection = type({
  environment: '"local" | "testing" | "development" | "staging" | "production"',
  name: 'string',
  username: 'string',
  'password?': 'string',
  host: 'string',
  'port?': type.or('number | string.numeric.parse', type('""').pipe(() => undefined)),
  database: 'string',
  client: '"pg" | "sqlite3" | "mysql" | "oracledb" | "tedious"',
  charts: Chart.array()
})
export type Connection = typeof Connection.infer

export const Config = type({
  theme: type('"system" |  "light" | "dark"').default('system'),
  connections: Connection.array().default(() => [])
})
export type Config = typeof Config.infer
