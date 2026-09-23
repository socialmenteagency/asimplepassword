# CLAUDE.md: asimplepassword

Static site, no backend. Everything the visitor sees is in `site/`.

- Docs and decisions live in the KB: `claude-code-kb/SocialMente/ASIMPLEPASSWORD/ASIMPLEPASSWORD_MASTER_MAP.md`.
- Work in a worktree, stage by explicit path, and push to `main`. Then deploy from cPanel (see README).
- `npm test` must pass before pushing (length logic).
- Don't add third-party requests to the page: the privacy promise ("generated in your browser, sent nowhere") is the product. GoatCounter is the only allowed outside host, and the CSP in `site/.htaccess` enforces it.
- Changing CSS/JS → bump `?v=` in `site/index.html`.
- Word lists: regenerate with `tools/words/` (NaN via `opencode`), never hand-edit `site/words.js`; add unwanted words to `tools/words/blocklist.txt` and rebuild.
