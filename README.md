# [asimplepassword.com](https://asimplepassword.com)

A password you can read, remember and paste: `found-PLANT-dance-3`.
Three simple words (lowercase, UPPERCASE, lowercase) and a number, generated in the browser.
No backend, no account, no cookies. English at `/`, Spanish at `/es/`, Brazilian Portuguese at `/pt/`.

**License:** the code is public so anyone can read it and check that passwords are made in the browser and sent nowhere. It is not open source: all rights reserved, see [LICENSE](LICENSE).

## How it works

- **Randomness:** every pick uses `crypto.getRandomValues` with rejection sampling (no modulo bias). See [`site/gen.js`](site/gen.js).
- **Length options:** words are never cut. To meet a minimum/maximum the generator swaps in 3–8 letter words, adds or removes a whole word, or adds digits.
- **Languages:** English, Spanish and Brazilian Portuguese, chosen from the browser language (no IP lookup). Visitors can switch.
- **Clipboard:** browsers only allow clipboard writes inside a user gesture, so the page copies on the first tap or key press anywhere. It never tries on load: in Chrome that shows a clipboard permission prompt.
- **Options** (separator, number, words, length, "Make it memorable") always start at the defaults. Only the language is saved in `localStorage`. Passwords are never stored.

## Press kit

Logo (SVG, 1024 px PNG) and 1920×1080 screenshots in English, Spanish and Portuguese: [`press/`](press/).

## Word lists

`site/words-en.js`, `words-es.js` and `words-pt.js` are built by [`tools/words/`](tools/words/README.md): NaN models generate candidates, a second NaN pass reviews them, wordfreq ranks them by how common they are, and a hand-kept blocklist removes regional slang.

## Develop

```
npm test                       # length logic, every min/max/separator combination
python3 -m http.server -d site # then open http://localhost:8000
```

## Language pages

`site/index.html` is the English template. `node tools/build-pages.js` writes `site/es/index.html` and `site/pt/index.html` from it and `site/i18n.js`: translated text, canonical and `hreflang` links, and the FAQ schema per language. Run it after changing either file; never edit the generated pages by hand.

## Deploy

Hosted on Raiola `com1019` (Hosting Base plan, cPanel account `mqcapijl`, document root `/home/mqcapijl/asimplepassword.com`).
The plan has no cPanel Git Version Control, so each file in `site/` is uploaded as text with the
cPanel MCP (`write_file`, domain `asimplepassword.com`). Then check that the live copy matches the repo:

```
./tools/check-live.sh
```

It compares every file in `site/` except `.htaccess` and `og.jpg`, and checks that the old design proposal (`index2.*`) is still offline. A GitHub Action (`.github/workflows/live-check.yml`) runs it every day and fails, with an email to the repo owner, if the live site differs from `main`.

`.htaccess` can't be fetched over HTTP; compare it with cPanel `Fileman::get_file_content`.

Two things learned the hard way (23-sep-2026):
- Always pass `dir: /home/mqcapijl/asimplepassword.com` to `write_file`. Without it the tool writes to `public_html/<domain>` and fails with "no existe".
- Upload `index.html` with `upload_file` (base64), not `write_file`. As plain text the request gets dropped ("fetch failed"), apparently by the server's web firewall, and repeated hits can get this Mac's IP banned from the whole server (it happened on 23-sep; Raiola's client area has an unblock option). Upload one file at a time and verify once at the end.
Bump the `?v=` query on the assets in `site/index.html` whenever CSS/JS changes: they're cached for a year.

## Security

Report problems privately: see [SECURITY.md](SECURITY.md) (also linked from `/.well-known/security.txt`, which expires every year: renew its `Expires` date before 24-sep-2027). HSTS covers subdomains and asks for preload. Visitors get only the site's own files: no third-party scripts, styles or fonts. `design/` keeps the old design proposal (`index2.*`) out of the deployed tree: it loaded GSAP and Fontshare from third-party servers, so it was taken offline on 24-sep-2026.

## Fonts

Anybody and Atkinson Hyperlegible Next / Mono, self-hosted in `site/fonts/` since 23-sep-2026 (unmodified Fontsource 5.3.0 builds; SIL Open Font License 1.1, notices in `site/fonts/OFL.txt`). The CSP allows fonts from `'self'` only. Upload them with `upload_file` (base64) into `/home/mqcapijl/asimplepassword.com/fonts`. Anybody uses `font-display: block` (it's preloaded) so the password doesn't jump when it arrives.
