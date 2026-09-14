import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Buffer } from 'node:buffer'

/**
 * Dev-only trace receiver — docs/DEBUG_TRACE.md. The phone playtests against this dev server, so the
 * app POSTs its debug trace here (when the trace is on) and it lands in `app/playtest-traces/` as
 * plain text that Claude Code can read straight from the repo checkout — no copy/paste step.
 *   POST /__eld/trace?session=<id>  body = trace text
 *   → app/playtest-traces/latest.txt  (always the most recent upload)
 *   → app/playtest-traces/<session>.txt (one file per app session)
 * The folder is git-ignored. Nothing is served or written in production builds.
 */
function traceReceiver() {
  return {
    name: 'eld-trace-receiver',
    apply: 'serve',
    configureServer(server) {
      const dir = resolve(server.config.root, 'playtest-traces')
      server.middlewares.use('/__eld/trace', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return }
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
          try {
            const text = Buffer.concat(chunks).toString('utf8')
            const url = new URL(req.url, 'http://x')
            const session = (url.searchParams.get('session') || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'unknown'
            mkdirSync(dir, { recursive: true })
            writeFileSync(resolve(dir, 'latest.txt'), text)
            writeFileSync(resolve(dir, `${session}.txt`), text)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, bytes: text.length, file: `playtest-traces/${session}.txt` }))
          } catch (e) {
            res.statusCode = 500
            res.end(String(e))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), traceReceiver()],
})
