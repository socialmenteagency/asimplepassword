# asimplepassword.com

A password you can read, remember and paste: `found-PLANT-dance-3`.
Three simple words (lowercase, UPPERCASE, lowercase) and a number, generated in the browser.
No backend, no account, no cookies.

## How it works

- **Randomness:** every pick uses `crypto.getRandomValues` with rejection sampling (no modulo bias). See [`site/gen.js`](site/gen.js).
- **Length options:** words are never cut. To meet a minimum/maximum the generator swaps in 3–8 letter words, adds or removes a whole word, or adds digits.
- **Languages:** English, Spanish and Brazilian Portuguese, chosen from the browser language (no IP lookup). Visitors can switch.
- **Clipboard:** browsers only allow clipboard writes inside a user gesture, so the page tries once on load (Chrome sometimes allows it) and otherwise copies on the first tap or key press anywhere.
- **Options** (separator, number, length, language) are saved in `localStorage`. Passwords are never stored.

## Word lists

`site/words.js` is built by [`tools/words/`](tools/words/README.md): NaN models generate candidates, a second NaN pass reviews them, wordfreq ranks them by how common they are, and a hand-kept blocklist removes regional slang.

## Develop

```
npm test                       # length logic, every min/max/separator combination
python3 -m http.server -d site # then open http://localhost:8000
```

## Deploy

Hosted on Raiola `com1019` (cPanel account `mqcapijl`, document root `/home/mqcapijl/asimplepassword.com`).
cPanel **Git Version Control** clones this repo; `.cpanel.yml` copies `site/` into the document root.
After pushing to `main`: cPanel → Git Version Control → *Update from Remote* → *Deploy HEAD Commit*
(or the UAPI calls `VersionControl::update` and `VersionControlDeployment::create`).
Bump the `?v=` query on the assets in `site/index.html` whenever CSS/JS changes: they're cached for a year.

## Fonts

Anybody and Atkinson Hyperlegible Next / Mono, self-hosted from Google Fonts (SIL Open Font License 1.1).
