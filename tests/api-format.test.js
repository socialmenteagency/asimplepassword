// site/api/password.php reads the word files with regexes. If tools/words regenerates them in
// another layout, the endpoint would break silently: this fails first.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SITE = path.join(__dirname, '..', 'site');

for (const lang of ['en', 'es', 'pt']) {
  const words = fs.readFileSync(path.join(SITE, `words-${lang}.js`), 'utf8');
  const pools = [...words.matchAll(/\b([3-8]):\s*`([^`]*)`/g)];
  assert.deepStrictEqual(pools.map(m => Number(m[1])), [3, 4, 5, 6, 7, 8], `${lang}: words-${lang}.js needs pools 3..8 as \`...\` blocks`);
  for (const [, len, body] of pools) {
    const list = body.trim().split(/\s+/);
    assert(list.length > 20, `${lang}: pool ${len} is too small`);
    assert(list.every(w => [...w].length === Number(len)), `${lang}: pool ${len} has a word of another length`);
  }

  const memo = fs.readFileSync(path.join(SITE, `memo-${lang}.js`), 'utf8');
  const order = JSON.parse(memo.match(/order:\s*(\{[^}]*\})/)[1]);
  assert.deepStrictEqual(Object.keys(order), ['2', '3', '4', '5'], `${lang}: memo order needs 2..5`);
  for (const c of ['N', 'V', 'A']) {
    const m = memo.match(new RegExp('\\b' + c + ':\\s*`([^`]*)`'));
    assert(m && m[1].trim().split(/\s+/).length > 20, `${lang}: memo pool ${c} not found`);
  }
}
console.log('api format ok');
