#!/usr/bin/env node
/**
 * Phone playtest launcher — `npm run dev:phone`
 *
 * Starts Vite bound to all interfaces (`--host`) on a fixed port, prints the URL for
 * every LAN / VPN address on this machine, and draws a QR code for the preferred one
 * so a phone can scan straight in.
 *
 *   npm run dev:phone                 → QR for the home-network address (192.168.x / 10.x)
 *   npm run dev:phone -- --tailscale  → QR for the Tailscale address (100.x) instead
 *   npm run dev:phone -- --host 1.2.3.4  → QR for an explicit address
 *   PHONE_PORT=5180 npm run dev:phone → different port (default 5173)
 *
 * Requirements: phone on the same Wi-Fi (or on Tailscale), and Windows Firewall
 * allowing Node.js inbound on a private network (it prompts the first time).
 */
import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode-terminal');

const args = process.argv.slice(2);
const port = Number(process.env.PHONE_PORT || 5173);
const wantTailscale = args.includes('--tailscale');
const hostArgIdx = args.indexOf('--host');
const explicitHost = hostArgIdx >= 0 ? args[hostArgIdx + 1] : null;

const addrs = [];
for (const [name, list] of Object.entries(networkInterfaces())) {
  for (const i of list || []) {
    if (i.family === 'IPv4' && !i.internal) addrs.push({ name, ip: i.address });
  }
}
const isLan = (ip) => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
const isTailscale = (ip, name) => /^100\./.test(ip) || /tailscale/i.test(name);

let preferred =
  explicitHost ||
  (wantTailscale
    ? addrs.find((a) => isTailscale(a.ip, a.name))?.ip
    : addrs.find((a) => isLan(a.ip) && !isTailscale(a.ip, a.name))?.ip) ||
  addrs[0]?.ip;

const line = '─'.repeat(56);
console.log(`\n${line}\n  Eldrathor phone playtest\n${line}`);
if (addrs.length === 0) {
  console.log('  No network addresses found — are you connected to Wi-Fi / Ethernet?');
} else {
  for (const a of addrs) {
    const tag = a.ip === preferred ? '  ◀ QR below' : '';
    console.log(`  ${a.name.padEnd(12)} http://${a.ip}:${port}/${tag}`);
  }
}
if (preferred) {
  const url = `http://${preferred}:${port}/`;
  console.log(`\n  Scan with the phone camera → ${url}\n`);
  qrcode.generate(url, { small: true }, (q) => console.log(q.replace(/^/gm, '  ')));
}
console.log(`${line}\n  Tip: --tailscale picks the 100.x address; Ctrl+C stops the server.\n${line}\n`);

// Run Vite's JS entry with the current Node directly (no shell, no .cmd shim).
const viteBin = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const vite = spawn(process.execPath, [viteBin, '--host', '--port', String(port), '--strictPort'], {
  stdio: 'inherit',
});
vite.on('exit', (code) => process.exit(code ?? 0));
