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

// Fixed word count (2-5) with an optional maximum length.
for (const words of [2, 3, 4, 5]) {
  for (const sep of ['', '-', '__']) {
    for (const number of [true, false]) {
      const fixed = sep.length * (words - 1 + (number ? 1 : 0)) + (number ? 1 : 0);
      // No max: five-letter words.
      const d = generate({ sep, number, words }, pools);
      assert.strictEqual(d.password.length, 5 * words + fixed);
      for (let max = 4; max <= 70; max++) {
        const r = generate({ sep, number, words, max }, pools);
        checked++;
        const shortest = 3 * words + fixed;
        if (max < shortest) { assert.strictEqual(r.error, 'tooShort'); assert.strictEqual(r.n, shortest); continue; }
        assert.ok(!r.error, JSON.stringify({ words, sep, number, max, r }));
        const w = r.parts.filter(p => p.type === 'lower' || p.type === 'upper');
        assert.strictEqual(w.length, words, 'word count');
        assert.ok(r.password.length <= max, `len ${r.password.length} > ${max}`);
        assert.strictEqual(r.password.length, Math.min(max, 5 * words + fixed), 'uses the room up to the max');
        w.forEach(x => assert.ok(x.text.length >= 3 && x.text.length <= 5));
      }
    }
  }
}
console.log(`ok — ${checked} generations checked`);

// Memorable mode: grammar slots, max length, uniform over fitting combinations.
{
  const { generateMemorable, prepareMemo } = require('../site/gen.js');
  const mk = (tag) => { const o = []; for (let L = 3; L <= 8; L++) for (let i = 0; i < 6; i++) o.push(tag + 'x'.repeat(L - 2) + String.fromCharCode(97 + i)); return o.join(' '); };
  const memo = prepareMemo({ order: { 2: 'NS', 3: 'ANS', 4: 'ANVN', 5: 'ANVAN' }, plain: { 3: 'NVN' }, N: mk('n'), V: mk('v'), S: mk('s'), A: mk('a') });
  let memoChecked = 0;
  for (const [words, shape] of [[2], [3], [4], [5], [3, 'NVN']]) {
    const order = shape || memo.order[words];
    for (const sep of ['', '-', '__']) {
      for (const number of [true, false]) {
        const fixed = sep.length * (words - 1 + (number ? 1 : 0)) + (number ? 1 : 0);
        for (const max of [null, 4, 10, 16, 22, 30, 45, 64]) {
          const r = generateMemorable({ sep, number, words, max }, memo, null, shape);
          memoChecked++;
          if (max !== null && max < 3 * words + fixed) { assert.strictEqual(r.error, 'tooShort'); assert.strictEqual(r.n, 3 * words + fixed); continue; }
          assert.ok(!r.error, JSON.stringify({ words, sep, number, max, r }));
          const w = r.parts.filter(p => p.type === 'lower' || p.type === 'upper');
          assert.strictEqual(w.length, words);
          w.forEach((x, i) => assert.strictEqual(x.text.toLowerCase()[0], order[i].toLowerCase(), 'slot type'));
          if (max) assert.ok(r.password.length <= max, `${r.password} > ${max}`);
          assert.strictEqual(r.parts.some(p => p.type === 'num'), number);
        }
      }
    }
  }
  // Uniformity: N = {aaa, bbb, cccc}, V = {vvv, vvvvv}, 7 letters of room.
  // Fitting combinations: aaa+vvv, bbb+vvv, cccc+vvv -> each about 1/3.
  const tiny = prepareMemo({ order: { 2: 'NV' }, N: 'aaa bbb cccc', V: 'vvv vvvvv', A: 'x' });
  const count = {};
  for (let i = 0; i < 30000; i++) {
    const r = generateMemorable({ sep: '', number: false, words: 2, max: 7 }, tiny);
    count[r.password.toLowerCase()] = (count[r.password.toLowerCase()] || 0) + 1;
  }
  assert.deepStrictEqual(Object.keys(count).sort(), ['aaavvv', 'bbbvvv', 'ccccvvv']);
  Object.values(count).forEach(c => assert.ok(Math.abs(c - 10000) < 600, 'uniform: ' + JSON.stringify(count)));
  console.log(`ok — memorable: ${memoChecked} setups, uniform ${JSON.stringify(count)}`);

  // ES/PT: an adjective pair counts once and agrees with its noun (gato ROJO, luna ROJA).
  const es = prepareMemo({ order: { 3: 'NAS' }, N: 'gato luna', F: 'luna', A: 'rojo|roja', S: 'baila' });
  const seen = new Set();
  for (let i = 0; i < 400; i++) seen.add(generateMemorable({ sep: '-', number: false, words: 3 }, es).password);
  assert.deepStrictEqual([...seen].sort(), ['gato-ROJO-baila', 'luna-ROJA-baila']);
}

// The real word files: every shape draws from its own pools and the adjectives agree.
{
  const fs = require('fs'), path = require('path');
  const { generateMemorable, prepareMemo } = require('../site/gen.js');
  for (const lang of ['en', 'es', 'pt']) {
    global.window = {};
    eval(fs.readFileSync(path.join(__dirname, '..', 'site', `memo-${lang}.js`), 'utf8'));
    const data = window.ASP_MEMO[lang];
    const memo = prepareMemo(data);
    const sets = {};
    for (const c of ['N', 'V', 'S', 'A']) sets[c] = new Set(data[c].trim().split(/\s+/).flatMap(w => w.split('|')));
    const shapes = Object.entries(data.order).map(([k, v]) => [Number(k), v, null]).concat(Object.entries(data.plain).map(([k, v]) => [Number(k), v, v]));
    for (const [words, order, shape] of shapes) {
      for (let i = 0; i < 300; i++) {
        const r = generateMemorable({ sep: '-', number: true, words }, memo, null, shape);
        const w = r.password.toLowerCase().split('-').slice(0, -1);
        w.forEach((x, j) => assert.ok(sets[order[j]].has(x), `${lang} ${order}: ${x} is not in ${order[j]}`));
        // Agreement: a feminine noun's adjective is the feminine form (first noun before it).
        for (let j = 0; j < order.length; j++) {
          if (order[j] !== 'A' || lang === 'en') continue;
          let n = j - 1; while (n >= 0 && order[n] !== 'N') n--;
          const pair = data.A.trim().split(/\s+/).find(t => t.split('|').includes(w[j]));
          if (n < 0 || !pair.includes('|')) continue;
          const want = pair.split('|')[memo.fem[w[n]] ? 1 : 0];
          assert.strictEqual(w[j], want, `${lang}: ${w[n]} ${w[j]} should be ${want}`);
        }
      }
    }
  }
  delete global.window;
  console.log('ok — real memo files: shapes, pools and agreement');
}
