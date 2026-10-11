// "Make it memorable" is on by default, so every page must load its memo data with the other
// scripts. Without it app.js quietly starts with the option off: this fails first.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SITE = path.join(__dirname, '..', 'site');

const app = fs.readFileSync(path.join(SITE, 'app.js'), 'utf8');
assert(/memo: true/.test(app.match(/var DEFAULTS = [^;]*;/)[0]), 'app.js: "Make it memorable" should be on by default');
// The two agent doors start the same way as the page.
assert(/memo: a\.memorable !== false/.test(app), 'app.js: the generate_password tool should default to memorable');
assert(/flag\(\$q, 'memorable', \$words >= 3,/.test(fs.readFileSync(path.join(SITE, 'api', 'password.php'), 'utf8')), 'api/password.php: memorable should be on by default');
const PAGES = { 'index.html': ['en', 'es', 'pt'], 'es/index.html': ['es'], 'pt/index.html': ['pt'] };
for (const [page, langs] of Object.entries(PAGES)) {
  const scripts = [...fs.readFileSync(path.join(SITE, page), 'utf8').matchAll(/<script src="\/([\w-]+\.js)/g)].map(m => m[1]);
  for (const kind of ['words', 'memo']) {
    assert.deepStrictEqual(scripts.filter(s => s.startsWith(kind + '-')), langs.map(l => `${kind}-${l}.js`), `${page}: wrong ${kind} files`);
  }
  assert(scripts.indexOf('app.js') > scripts.indexOf(`memo-${langs[langs.length - 1]}.js`), `${page}: app.js must come after the memo files`);
}
console.log('pages ok');
