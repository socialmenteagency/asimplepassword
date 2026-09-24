// Builds site/es/index.html and site/pt/index.html from site/index.html (the
// English template) and the strings in site/i18n.js, so search engines and AI
// crawlers get each language as real HTML at its own URL. It also refreshes
// the English page's FAQ schema. Run after changing index.html or i18n.js:
//   node tools/build-pages.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = path.join(__dirname, '..', 'site');
const ORIGIN = 'https://asimplepassword.com';
const PAGES = {
  en: { dir: '', htmlLang: 'en', sample: 'found-PLANT-dance-3' },
  es: { dir: 'es', htmlLang: 'es', sample: 'gato-PLAYA-verde-3' },
  pt: { dir: 'pt', htmlLang: 'pt-BR', sample: 'gato-PRAIA-verde-3' }
};

// Load the same data files the page loads.
const sandbox = {};
sandbox.window = sandbox; // the files use both window.X and bare X
vm.createContext(sandbox);
for (const f of ['i18n.js', 'words-en.js', 'words-es.js', 'words-pt.js']) {
  vm.runInContext(fs.readFileSync(path.join(SITE, f), 'utf8'), sandbox);
}
const I18N = sandbox.ASP_I18N;
const WORDS = sandbox.ASP_WORDS;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
const pageUrl = (lang) => ORIGIN + '/' + (PAGES[lang].dir ? PAGES[lang].dir + '/' : '');

// Same numbers as app.js shows in the "why three words" paragraph.
function s2p(lang) {
  const n = WORDS[lang][5].length;
  const loc = PAGES[lang].htmlLang;
  const combos = new Intl.NumberFormat(loc, { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: 2 }).format(Math.pow(n, 3) * 10);
  return I18N[lang].s2p.replace('{words}', new Intl.NumberFormat(loc).format(Math.round(n / 100) * 100)).replace('{combos}', combos);
}

function faqSchema(lang) {
  const d = I18N[lang];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: PAGES[lang].htmlLang,
    mainEntity: [1, 2, 3, 4, 5].map((i) => ({
      '@type': 'Question', name: d['q' + i],
      acceptedAnswer: { '@type': 'Answer', text: d['a' + i] }
    }))
  });
}

function appSchema(lang) {
  return JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication',
    name: 'A Simple Password', url: pageUrl(lang), description: I18N[lang].description,
    applicationCategory: 'SecurityApplication', operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    inLanguage: PAGES[lang].htmlLang
  });
}

function build(template, lang) {
  const d = I18N[lang], p = PAGES[lang];
  let h = template;
  const one = (re, fn) => {
    const m = h.match(re);
    if (!m) throw new Error(lang + ': pattern not found: ' + re);
    h = h.replace(re, fn);
  };

  one(/<html lang="[^"]*"[^>]*>/, () => '<html lang="' + p.htmlLang + '"' + (lang === 'en' ? '' : ' data-page-lang="' + lang + '"') + '>');
  one(/<title>[^<]*<\/title>/, () => '<title>' + esc(d.title) + '</title>');
  one(/<meta name="description" content="[^"]*">/, () => '<meta name="description" content="' + escAttr(d.description) + '">');
  one(/<link rel="canonical" href="[^"]*">/, () => '<link rel="canonical" href="' + pageUrl(lang) + '">');
  one(/<meta property="og:url" content="[^"]*">/, () => '<meta property="og:url" content="' + pageUrl(lang) + '">');
  one(/<meta property="og:description" content="[^"]*">/, () => '<meta property="og:description" content="' + escAttr(d.description) + '">');
  one(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"WebApplication".*?<\/script>/, () => '<script type="application/ld+json">' + appSchema(lang) + '</script>');
  one(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"FAQPage".*?<\/script>/, () => '<script type="application/ld+json">' + faqSchema(lang) + '</script>');

  // Logo goes to this language's home; the current language link is marked.
  one(/<a class="mark" href="[^"]*"/, () => '<a class="mark" href="/' + (p.dir ? p.dir + '/' : '') + '"');
  h = h.replace(/(<a href="[^"]*" data-lang="(\w+)"[^>]*?)( aria-current="page")?>/g, (m, open, l) => open + (l === lang ? ' aria-current="page"' : '') + '>');

  // Visible text: every element with data-i18n holds plain text.
  h = h.replace(/(<([a-z0-9]+)\b[^>]*\bdata-i18n="(\w+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, key, text, close) => {
    if (!(key in d)) throw new Error(lang + ': missing key ' + key);
    return open + esc(key === 's2p' ? s2p(lang) : d[key]) + close;
  });
  h = h.replace(/(data-i18n-title="(\w+)"[^>]*?\btitle=")[^"]*"/g, (m, open, key) => open + escAttr(d[key]) + '"');
  h = h.replace(/(data-i18n-placeholder="(\w+)"[^>]*?\bplaceholder=")[^"]*"/g, (m, open, key) => open + escAttr(d[key]) + '"');
  one(/(id="memoInfo"[^>]*aria-label=")[^"]*"/, (m, open) => open + escAttr(d.memoInfo) + '"');
  one(/(<span class="tip" id="memoTip" role="tooltip">)[^<]*(<\/span>)/, (m, open, close) => open + esc(d.memoTip) + close);

  // The sample password and its length, until the script draws a new one.
  one(/(<output class="pw" id="pw"[^>]*>)[^<]*(<\/output>)/, (m, open, close) => open + p.sample + close);
  one(/(<span id="chkLength">)[^<]*(<\/span>)/, (m, open, close) => open + esc(d.chkLength.replace('{n}', p.sample.length)) + close);
  return h;
}

const templatePath = path.join(SITE, 'index.html');
const template = fs.readFileSync(templatePath, 'utf8');
for (const lang of Object.keys(PAGES)) {
  const out = build(template, lang);
  const dir = path.join(SITE, PAGES[lang].dir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);
  console.log('wrote', path.relative(path.join(SITE, '..'), path.join(dir, 'index.html')));
}
