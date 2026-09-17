# Eldrathor — Working From Anywhere

This project lives in a **private GitHub repo**: <https://github.com/HaDeZs530/eldrathor>
GitHub is the sync hub — every machine pulls from and pushes to it. Never work off a stray copy.

---

## A. Set up on another computer (Windows / Mac / Linux)

**One-time setup per machine:**

1. **Install prerequisites**
   - **Git** — <https://git-scm.com/downloads>
   - **Node.js 24** — <https://nodejs.org> (gives you `node` and `npm`). The version is pinned in `app/.nvmrc` and `app/package.json` → `engines`; with nvm / fnm, `nvm use` inside `app/` picks it up. CI runs on the same version.
   - **GitHub CLI** (optional but easiest for auth) — <https://cli.github.com>

2. **Authenticate to GitHub** (so you can pull/push the private repo)
   - Easiest: `gh auth login` → GitHub.com → HTTPS → Yes → *Login with a web browser* → paste the one-time code → authorize as **HaDeZs530**.
   - No `gh`? Git will prompt for a browser sign-in (via Git Credential Manager) on your first `git push`.

3. **Clone the repo**
   ```
   git clone https://github.com/HaDeZs530/eldrathor.git
   ```

4. **Install the app's dependencies** (they're not in git by design)
   ```
   cd eldrathor/app
   npm ci
   ```
   (`npm ci` installs exactly what `package-lock.json` says — the same thing CI does. Use `npm install` only when you mean to change dependencies.)

5. **Run it**
   ```
   npm run dev
   ```
   Open the printed URL (usually <http://localhost:5173>).

6. **Check it** — the tests are the spec (`CLAUDE.md`):
   ```
   npm test        # Node's built-in runner
   npm run lint
   npm run build
   ```
   The same three run in GitHub Actions on every pull request and on `main` (`.github/workflows/ci.yml`, check `build-and-test`); `main` should require that check (Settings → Rules → Rulesets).

**Phone playtest (same Wi-Fi or Tailscale):**
```
npm run dev:phone
```
That is Vite with `--host` on port 5173: it prints the LAN URL(s) (`http://192.168.x.x:5173`); on Tailscale use the PC's Tailscale IP (`http://100.x.y.z:5173`). Open it in Safari on the phone.

**Keep it running when the terminal / Claude session closes:** `npm run dev:phone:bg` (`app/scripts/dev-detached.ps1`) starts the same server as a detached hidden process and leaves it running until the PC reboots or you kill it; it is idempotent (does nothing if 5173 already answers). Log: `%TEMP%\eldrathor-dev-5173.log`. This is the launcher to use before a phone playtest — a server started from a Claude Code session dies with that session.

**Host mode (this PC is the game host; other Claude sessions push PRs):** `npm run host:register` registers the Windows scheduled task **"Eldrathor dev keep-alive"** — at logon (only; the 2-minute repeat was removed because its window flashed while working) it runs `app/scripts/keep-alive.ps1`: on a clean `main` checkout it fast-forwards to `origin/main` (runs `npm ci` if the lock file changed) and starts the dev server if 5173 is down. Vite hot-reloads the pulled files. Between logons, the coding session that merges a PR pulls `main` on this PC (its normal `git pull`), which is what puts the change on the phone. A feature branch or local edits are never touched (that session owns the tree). Log: `%TEMP%\eldrathor-keepalive.log`. Remove with `npm run host:unregister`. The debug trace asks the running server for the live build stamp (`/__eld/build`), so traces name the pulled commit. The debug trace (☰ → Debug trace) auto-saves to `app/playtest-traces/` on the PC while served this way (`docs/DEBUG_TRACE.md`).

**Every work session on that machine:**
```
git pull            # get the latest first — ALWAYS
# ...do your work...
git add -A
git commit -m "Clear message about what changed and why"
git push            # back up + make it available everywhere
```

---

## B. Work from iOS / iPhone / iPad

Your **PC's files are not reachable from the phone** — the Claude iOS app can't touch them.
The way to work mobile is **Claude Code on the web**, running against this GitHub repo in a cloud environment.

1. On your phone, open a browser (or the Claude app) and go to **<https://claude.ai/code>**. Sign in.
2. **Connect your GitHub account** when prompted (authorize as **HaDeZs530**).
3. **Select the `eldrathor` repo.** Claude Code spins up a cloud workspace with the code already cloned.
4. Work normally — ask it to make changes, run the app, etc. It **commits and pushes to GitHub** for you, so the work shows up on your other machines after a `git pull`.

Notes:
- This is the same repo as your PC. Pull on your PC (`git pull`) to bring down anything you did on mobile, and vice-versa.
- For quick text edits without Claude, iOS git apps like **Working Copy** can also clone and push this repo — but Claude Code web is the main path.

---

## C. Golden rules (see also CLAUDE.md → "Git workflow")

- **Pull before you start.** Another machine or a mobile session may be ahead.
- **Commit in logical chunks** with messages that say what changed and why.
- **Push when a task is done** so nothing lives only on one device.
- If a pull reports **conflicts**, stop and resolve them — don't force-push over other work.
- After cloning anywhere, run `npm install` inside `app/` before `npm run dev`.

---

## Quick reference

| Thing | Value |
|---|---|
| Repo (private) | https://github.com/HaDeZs530/eldrathor |
| Clone command | `git clone https://github.com/HaDeZs530/eldrathor.git` |
| GitHub account | HaDeZs530 |
| Run the app | `cd eldrathor/app && npm ci && npm run dev` |
| Phone playtest | `npm run dev:phone` → open the printed LAN / Tailscale URL |
| Node | 24 (`app/.nvmrc`) |
| CI | `.github/workflows/ci.yml` — lint, build, test on PRs + main |
| Mobile dev | https://claude.ai/code → connect GitHub → open `eldrathor` |
