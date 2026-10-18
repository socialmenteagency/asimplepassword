# CLAUDE.md: asimplepassword

Static site. Everything the visitor sees is in `site/`. The one server-side piece is the agent endpoint `site/api/password.php` (added 30-sep-2026, decided by Rafael): keep it in step with `site/gen.js`, and never log or store what it generates.

- Docs and decisions live in the KB: `claude-code-kb/SocialMente/ASIMPLEPASSWORD/ASIMPLEPASSWORD_MASTER_MAP.md`.
- **Any new interface or visual piece: follow `/design-with-intent` first** (KB rule, 18-Oct-2026), and its editor pass again before calling it done. Without the KB (a cloud session with only this repo), read `.claude/commands/design-with-intent.md` in `socialmenteagency/claude-code-kb`, adding that repo to the session.
- Work in a worktree, stage by explicit path, and push to `main`. Then upload the changed files through the cPanel MCP and verify the live copies (README, Deploy).
- `npm test` must pass before pushing (length logic, and the word-file layout the PHP endpoint parses). After a deploy, `./tools/check-live.sh` also runs `tools/check-api.js` against the live endpoint.
- Don't add third-party requests to the page: the privacy promise ("generated in your browser, sent nowhere") is the product. The page loads nothing from other hosts (fonts are self-hosted in `site/fonts/`); the CSP in `site/.htaccess` enforces it. "Make it memorable" is on by default (11-oct-2026), so every page loads its `memo-*.js` with the other scripts; `/es/` and `/pt/` load only their own word list and memo file (`/` loads all three: it picks the language in the browser). Visits are counted from the server logs (cPanel AWStats), not a script.
- Changing CSS/JS → bump `?v=` in `site/index.html`.
- `site/index.html` is the English template. After changing it or `site/i18n.js`, run `node tools/build-pages.js`: it writes `site/es/index.html` and `site/pt/index.html`. Never hand-edit those two.
- Word lists: regenerate with `tools/words/` (NaN via `opencode`), never hand-edit `site/words-*.js`; add unwanted words to `tools/words/blocklist.txt` and rebuild.
