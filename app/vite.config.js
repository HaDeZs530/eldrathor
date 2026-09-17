import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, writeFile, readdir, stat, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { Buffer } from 'node:buffer'

/** Build identity baked into the bundle (debug trace header + run-start snapshot): git short hash + build time. */
function buildId() {
  let hash = 'nogit'
  try { hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || hash } catch { /* no git (CI tarball, zip) */ }
  return `${hash}@${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
}

/**
 * Dev-only trace receiver — docs/DEBUG_TRACE.md. The phone playtests against this dev server, so the
 * app POSTs its debug trace here (when the trace is on) and it lands in `app/playtest-traces/` as
 * plain text that Claude Code can read straight from the repo checkout — no copy/paste step.
 *   POST /__eld/trace?session=<id>  body = trace text
 *   → app/playtest-traces/latest.txt  (always the most recent upload)
 *   → app/playtest-traces/<session>.txt (one file per app session)
 * The folder is git-ignored. Nothing is served or written in production builds.
 * Hardening (M1d): body limit, bounded retention (latest + the newest MAX_SESSION_FILES sessions),
 * async writes, and a LAN-only check — only loopback / private-network / Tailscale peers may post.
 */
export const TRACE_MAX_BODY_BYTES = 1024 * 1024 // 1 MiB — ~1500 events is ~200 KB
export const MAX_SESSION_FILES = 20

/** Loopback, RFC1918 private ranges, Tailscale CGNAT (100.64/10) and IPv6 ULA / loopback. */
export function isLanAddress(addr) {
  if (!addr) return false
  const a = addr.replace(/^::ffff:/, '')
  if (a === '::1' || a === '127.0.0.1' || a.startsWith('127.')) return true
  if (/^10\./.test(a)) return true
  if (/^192\.168\./.test(a)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(a)) return true
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(a)) return true // Tailscale / CGNAT
  if (/^f[cd][0-9a-f]{2}:/i.test(a)) return true // IPv6 ULA
  if (/^fe80:/i.test(a)) return true // link-local
  return false
}

/** Keep `latest.txt` + the newest `max` session files; delete the rest (oldest first). */
export async function pruneTraces(dir, max = MAX_SESSION_FILES) {
  let names
  try { names = await readdir(dir) } catch { return [] }
  const files = []
  for (const n of names) {
    if (n === 'latest.txt' || !n.endsWith('.txt')) continue
    try { const s = await stat(resolve(dir, n)); files.push({ n, m: s.mtimeMs }) } catch { /* raced */ }
  }
  files.sort((x, y) => y.m - x.m)
  const gone = files.slice(max)
  await Promise.all(gone.map((f) => unlink(resolve(dir, f.n)).catch(() => {})))
  return gone.map((f) => f.n)
}

function traceReceiver() {
  return {
    name: 'eld-trace-receiver',
    apply: 'serve',
    configureServer(server) {
      const dir = resolve(server.config.root, 'playtest-traces')
      // live build stamp (git short hash @ commit time) — the `define` below is frozen at server start, and
      // the keep-alive task pulls new commits under a running server
      server.middlewares.use('/__eld/build', (req, res) => {
        let hash = 'nogit'; let when = ''
        try { hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); when = execSync('git log -1 --format=%cd --date=format:%Y-%m-%dT%H:%M', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { /* no git */ }
        res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify({ build: `${hash}@${when}` }))
      })
      server.middlewares.use('/__eld/trace', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return }
        if (!isLanAddress(req.socket?.remoteAddress)) { res.statusCode = 403; res.end('LAN only'); return }
        // a browser Origin, when present, must be this dev server (no cross-site posts)
        const origin = req.headers.origin
        if (origin) {
          try { if (new URL(origin).host !== req.headers.host) { res.statusCode = 403; res.end('bad origin'); return } } catch { res.statusCode = 403; res.end('bad origin'); return }
        }
        const declared = Number(req.headers['content-length'] || 0)
        if (declared > TRACE_MAX_BODY_BYTES) { res.statusCode = 413; res.end('trace too large'); return }
        const chunks = []
        let size = 0
        let tooBig = false
        req.on('data', (c) => {
          if (tooBig) return
          size += c.length
          if (size > TRACE_MAX_BODY_BYTES) { tooBig = true; res.statusCode = 413; res.end('trace too large'); req.destroy(); return }
          chunks.push(c)
        })
        req.on('end', async () => {
          if (tooBig) return
          try {
            const text = Buffer.concat(chunks).toString('utf8')
            const url = new URL(req.url, 'http://x')
            const session = (url.searchParams.get('session') || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'unknown'
            await mkdir(dir, { recursive: true })
            await Promise.all([writeFile(resolve(dir, 'latest.txt'), text), writeFile(resolve(dir, `${session}.txt`), text)])
            const pruned = await pruneTraces(dir)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, bytes: text.length, file: `playtest-traces/${session}.txt`, pruned: pruned.length }))
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
  define: { __ELD_BUILD__: JSON.stringify(buildId()) },
})
