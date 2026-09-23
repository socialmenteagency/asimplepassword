// node test.js — exhaustive check of the length logic against fake word pools.
'use strict';
const assert = require('assert');
const { generate, plan } = require('../site/gen.js');

const pools = {};
for (let len = 3; len <= 8; len++) pools[len] = Array.from({ length: 50 }, (_, i) => ('abcdefgh'[i % 8]).repeat(len - 1) + String.fromCharCode(97 + (i % 26)));

let checked = 0;
// Default: lowercase-UPPERCASE-lowercase-digit, 19 characters.
for (let i = 0; i < 200; i++) {
  const r = generate({ sep: '-', number: true }, pools);
  assert.strictEqual(r.password.length, 19);
  assert.deepStrictEqual(r.parts.map(p => p.type), ['lower', 'sep', 'upper', 'sep', 'lower', 'sep', 'num']);
  assert.match(r.password, /^[a-z]{5}-[A-Z]{5}-[a-z]{5}-\d$/);
}
assert.strictEqual(generate({ sep: '', number: false }, pools).password.length, 15);
assert.strictEqual(generate({ sep: '__', number: true }, pools).password.length, 22);

for (const sep of ['', '-', '__', '...']) {
  for (const number of [true, false]) {
    for (let min = 0; min <= 70; min++) {
      for (const max of [0, min, min + 1, min + 5, min + 20]) {
        const s = { sep, number, min: min || null, max: max || null };
        for (let rep = 0; rep < 3; rep++) {
          const r = generate(s, pools);
          checked++;
          if (r.error) {
            // An error is only acceptable when the range really is impossible.
            if (r.error === 'range') continue;
            const n = r.n;
            if (r.error === 'tooShort') assert.ok((s.max || Infinity) < n, JSON.stringify({ s, r }));
            else assert.ok((s.min || 0) > n, JSON.stringify({ s, r }));
            continue;
          }
          const L = r.password.length;
          assert.ok(L >= (s.min || 0) && L <= (s.max || Infinity), `len ${L} outside ${JSON.stringify(s)}: ${r.password}`);
          const words = r.parts.filter(p => p.type === 'lower' || p.type === 'upper');
          words.forEach(w => assert.ok(w.text.length >= 3 && w.text.length <= 8));
          assert.strictEqual(new Set(words.map(w => w.text.toLowerCase())).size, words.length, 'duplicate word');
          assert.strictEqual(r.parts.some(p => p.type === 'num'), number);
        }
      }
    }
  }
}
assert.strictEqual(plan({ sep: '-', number: true, min: 30, max: 20 }).error, 'range');
console.log(`ok — ${checked} generations checked`);
