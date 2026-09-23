// Password generator: pure functions, no DOM. Loaded by the page and by test.js.
(function (root) {
  'use strict';

  var MIN_WORD = 3, MAX_WORD = 8, MIN_WORDS = 2, MAX_WORDS = 8, MAX_DIGITS = 4;

  // Uniform integer in [0, n) from the platform CSPRNG. Rejection sampling
  // avoids the modulo bias of `random % n`.
  function randInt(n) {
    var limit = Math.floor(0x100000000 / n) * n;
    var buf = new Uint32Array(1);
    do { root.crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }

  function defaultLength(s) {
    var num = s.number ? 1 : 0;
    return 15 + s.sep.length * (2 + num) + num;
  }

  // Decide how many words, how long each one is, and how many digits,
  // so the total lands inside [min, max]. Words are never cut.
  function plan(s, rand) {
    rand = rand || randInt;
    var sep = s.sep.length, num = s.number;
    var min = s.min || 0, max = s.max || Infinity;
    if (s.min && s.max && s.min > s.max) return { error: 'range' };

    var def = defaultLength(s);
    if (def >= min && def <= max) return { lengths: [5, 5, 5], digits: num ? 1 : 0 };

    var target = def < min ? min : max;
    var best = null;
    for (var k = MIN_WORDS; k <= MAX_WORDS; k++) {
      var dOpts = num ? [1, 2, 3, 4] : [0];
      for (var i = 0; i < dOpts.length; i++) {
        var d = dOpts[i];
        var letters = target - sep * (k - 1 + (num ? 1 : 0)) - d;
        if (letters < MIN_WORD * k || letters > MAX_WORD * k) continue;
        // Prefer ~5-letter words, then 3 words, then a single digit.
        var cost = Math.abs(letters / k - 5) * 2 + Math.abs(k - 3) + (num ? (d - 1) * 0.8 : 0);
        if (!best || cost < best.cost) best = { k: k, d: d, letters: letters, cost: cost };
      }
    }
    if (!best) {
      var shortest = MIN_WORDS * MIN_WORD + sep * (MIN_WORDS - 1 + (num ? 1 : 0)) + (num ? 1 : 0);
      var longest = MAX_WORDS * MAX_WORD + sep * (MAX_WORDS - 1 + (num ? 1 : 0)) + (num ? MAX_DIGITS : 0);
      return target < shortest ? { error: 'tooShort', n: shortest } : { error: 'tooLong', n: longest };
    }
    return { lengths: split(best.letters, best.k, rand), digits: best.d };
  }

  // Spread `total` letters over `k` words as evenly as possible, with a
  // little random variation so adapted passwords don't all look alike.
  function split(total, k, rand) {
    var base = Math.floor(total / k), rem = total - base * k;
    var out = [];
    for (var i = 0; i < k; i++) out.push(base);
    var idx = out.map(function (_, i) { return i; });
    for (var r = 0; r < rem; r++) {
      var j = r + rand(k - r);
      var t = idx[r]; idx[r] = idx[j]; idx[j] = t;
      out[idx[r]]++;
    }
    for (var p = 0; p < k; p++) {
      var a = rand(k), b = rand(k);
      if (a !== b && rand(2) && out[a] > MIN_WORD && out[b] < MAX_WORD && out[a] > out[b]) { out[a]--; out[b]++; }
    }
    return out;
  }

  // Returns { parts: [{type, text}], password } or { error, n }.
  // Word case alternates: lowercase-UPPERCASE-lowercase-...
  function generate(s, pools, rand) {
    rand = rand || randInt;
    var p = plan(s, rand);
    if (p.error) return p;
    var used = {}, parts = [];
    p.lengths.forEach(function (len, i) {
      var list = pools[len], w, tries = 0;
      do { w = list[rand(list.length)]; } while (used[w] && ++tries < 50);
      used[w] = true;
      if (parts.length && s.sep) parts.push({ type: 'sep', text: s.sep });
      parts.push({ type: i % 2 ? 'upper' : 'lower', text: i % 2 ? w.toUpperCase() : w });
    });
    if (p.digits) {
      var digits = '';
      for (var d = 0; d < p.digits; d++) digits += String(rand(10));
      if (s.sep) parts.push({ type: 'sep', text: s.sep });
      parts.push({ type: 'num', text: digits });
    }
    return { parts: parts, password: parts.map(function (x) { return x.text; }).join('') };
  }

  var api = { plan: plan, generate: generate, defaultLength: defaultLength, randInt: randInt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ASP = api;
})(typeof window !== 'undefined' ? window : globalThis);
