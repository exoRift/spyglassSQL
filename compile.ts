import { build } from 'vite'
import type { RollupOutput, OutputAsset } from 'rollup'

import config from './view/vite.config'

export async function compileView (path: string): Promise<string> {
  const output = await build({
    ...config,
    build: {
      write: false,
      rollupOptions: {
        input: path
      }
    }
  }) as RollupOutput

  return (output.output[0] as unknown as OutputAsset).source as string
}
