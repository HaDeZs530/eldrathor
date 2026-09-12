# Process template — Design Chat ⇄ Claude Code

Generic copy of the Eldrathor working process. To start a new game project:
1. Create an empty GitHub repo (public, or private + fine-grained token with Contents read/write).
2. In Claude Code: clone it, copy everything under this folder's `docs/` and `CLAUDE.md` into the repo root, replace every `{{GAME}}` and `{{ONE_LINE_CONCEPT}}`, commit, push.
3. Create a claude.ai Project named "{{GAME}} — Design" and paste `PROJECT_INSTRUCTIONS.md` (edited) into its custom instructions.
4. First Design Chat session: paste the token, say "clone the repo and start the design doc from `docs/DESIGN_DOC_SKELETON.md`."
