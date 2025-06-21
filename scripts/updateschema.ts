import path from 'path'

import { Config } from '../lib/config'

const schema = Config.toJsonSchema({
  fallback: {
    morph: (ctx) => ctx.out ?? ctx.base
  }
})

await Bun.write(path.resolve(import.meta.dirname, '../lib/configschema.json'), JSON.stringify(schema, null, 2))
