# CLAUDE.md: asimplepassword

Static site, no backend. Everything the visitor sees is in `site/`.

- Docs and decisions live in the KB: `claude-code-kb/SocialMente/ASIMPLEPASSWORD/ASIMPLEPASSWORD_MASTER_MAP.md`.
- Work in a worktree, stage by explicit path, and push to `main`. Then upload the changed files through the cPanel MCP and verify the live copies (README, Deploy).
- `npm test` must pass before pushing (length logic).
- Don't add third-party requests to the page: the privacy promise ("generated in your browser, sent nowhere") is the product. The only outside host is jsDelivr (fonts, pinned versions); the CSP in `site/.htaccess` enforces it. Visits are counted from the server logs (cPanel AWStats), not a script.
- Changing CSS/JS → bump `?v=` in `site/index.html`.
- `site/index.html` is the English template. After changing it or `site/i18n.js`, run `node tools/build-pages.js`: it writes `site/es/index.html` and `site/pt/index.html`. Never hand-edit those two.
- Word lists: regenerate with `tools/words/` (NaN via `opencode`), never hand-edit `site/words-*.js`; add unwanted words to `tools/words/blocklist.txt` and rebuild.
