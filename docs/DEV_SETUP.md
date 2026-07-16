# Eldrathor — Working From Anywhere

This project lives in a **private GitHub repo**: <https://github.com/HaDeZs530/eldrathor>
GitHub is the sync hub — every machine pulls from and pushes to it. Never work off a stray copy.

---

## A. Set up on another computer (Windows / Mac / Linux)

**One-time setup per machine:**

1. **Install prerequisites**
   - **Git** — <https://git-scm.com/downloads>
   - **Node.js** (LTS) — <https://nodejs.org> (gives you `node` and `npm`)
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
   npm install
   ```

5. **Run it**
   ```
   npm run dev
   ```
   Open the printed URL (usually <http://localhost:5173>).

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
| Run the app | `cd eldrathor/app && npm install && npm run dev` |
| Mobile dev | https://claude.ai/code → connect GitHub → open `eldrathor` |
