import { Webview } from 'webview-bun'
import { compileView } from './compile' with { type: 'macro' }

const compiled = await compileView('./view/index.html')

const webview = new Webview()

webview.bind('log', (...args) => console.log(...args))

/* eslint-disable no-var */
declare global {
  var log: typeof console.log
}
/* eslint-enable no-var */

webview.title = 'SpyglassSQL'
webview.setHTML(compiled)
webview.run()
process.exit(0)
