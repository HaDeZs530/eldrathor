# Workflows

- `workflows/ci.yml` — **CI** on every pull request and on pushes to `main`: `npm ci`, `npm run lint`, `npm run build`, `npm test` inside `app/` on the Node version pinned in `app/.nvmrc`. The check is named `build-and-test`; the `main` ruleset should require it before merge (Anthony enables the ruleset in the repo settings — Settings → Rules → Rulesets → require status checks → `build-and-test`).
