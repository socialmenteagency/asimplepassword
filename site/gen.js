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
    if (s.words) return planWords(s, rand);
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

  // A fixed number of words (2-5), five letters each. A maximum length makes
  // the words shorter (never under three letters) instead of dropping any.
  function planWords(s, rand) {
    var k = s.words, num = s.number ? 1 : 0;
    var fixed = s.sep.length * (k - 1 + num) + num;
    var letters = 5 * k;
    if (s.max && letters + fixed > s.max) {
      letters = s.max - fixed;
      if (letters < MIN_WORD * k) return { error: 'tooShort', n: MIN_WORD * k + fixed };
    }
    var lengths = [];
    for (var i = 0; i < k; i++) lengths.push(5);
    return { lengths: letters === 5 * k ? lengths : split(letters, k, rand), digits: num };
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

  // Uniform integer in [0, n) for n up to 2^53, from two 32-bit draws.
  function randBig(n) {
    var limit = Math.floor(9007199254740992 / n) * n;
    var buf = new Uint32Array(2), x;
    do {
      root.crypto.getRandomValues(buf);
      x = (buf[0] & 0x1fffff) * 4294967296 + buf[1];
    } while (x >= limit);
    return x % n;
  }

  // Memorable mode: words fill grammar slots so the password reads like a tiny
  // sentence (N noun, V verb in its "she does" form, A adjective), e.g.
  // otter-PAINTS-moon-4. Every slot is still a uniform random draw. A max length
  // is met by counting, for each slot, how many combinations fit the letters
  // left; one weighted draw per slot then keeps every fitting combination
  // equally likely, with no retry loop.
  // memo: { order: {2: 'NV', ...}, N: {len: [words]}, V: {...}, A: {...} }
  function generateMemorable(s, memo, rand) {
    rand = rand || randBig;
    var order = memo.order[s.words].split('');
    var k = order.length, num = s.number ? 1 : 0;
    var fixed = s.sep.length * (k - 1 + num) + num;
    var budget = Math.min(s.max ? s.max - fixed : Infinity, MAX_WORD * k);
    var slots = order.map(function (c) { return memo[c]; });

    // ways[i][b]: combinations for slots i..k-1 using at most b letters.
    var ways = [];
    ways[k] = [];
    for (var b = 0; b <= Math.max(budget, 0); b++) ways[k][b] = 1;
    for (var i = k - 1; i >= 0; i--) {
      ways[i] = [];
      for (b = 0; b <= Math.max(budget, 0); b++) {
        var total = 0;
        for (var L = MIN_WORD; L <= Math.min(MAX_WORD, b); L++) {
          if (slots[i][L]) total += slots[i][L].length * ways[i + 1][b - L];
        }
        ways[i][b] = total;
      }
    }
    if (budget < 0 || !ways[0][budget]) {
      var shortest = fixed;
      slots.forEach(function (slot) { for (var L = MIN_WORD; L <= MAX_WORD; L++) if (slot[L] && slot[L].length) { shortest += L; break; } });
      return { error: 'tooShort', n: shortest };
    }

    for (var attempt = 0; attempt < 20; attempt++) {
      var left = budget, words = [], used = {}, dup = false;
      for (i = 0; i < k; i++) {
        var r = rand(ways[i][left]);
        for (L = MIN_WORD; L <= Math.min(MAX_WORD, left); L++) {
          if (!slots[i][L]) continue;
          var per = ways[i + 1][left - L], w = slots[i][L].length * per;
          if (r < w) { var word = slots[i][L][Math.floor(r / per)]; break; }
          r -= w;
        }
        if (used[word]) { dup = true; break; }
        used[word] = true; words.push(word); left -= L;
      }
      if (!dup) break;
    }

    var parts = [];
    words.forEach(function (w, i) {
      if (parts.length && s.sep) parts.push({ type: 'sep', text: s.sep });
      parts.push({ type: i % 2 ? 'upper' : 'lower', text: i % 2 ? w.toUpperCase() : w });
    });
    if (num) {
      if (s.sep) parts.push({ type: 'sep', text: s.sep });
      parts.push({ type: 'num', text: String(randInt(10)) });
    }
    return { parts: parts, password: parts.map(function (x) { return x.text; }).join('') };
  }

  // Turns a memo data file ({ N: 'word word ...', ... }) into length buckets.
  function prepareMemo(data) {
    var out = { order: data.order };
    ['N', 'V', 'A'].forEach(function (c) {
      out[c] = {};
      data[c].trim().split(/\s+/).forEach(function (w) { (out[c][w.length] = out[c][w.length] || []).push(w); });
    });
    return out;
  }

  var api = { plan: plan, generate: generate, generateMemorable: generateMemorable, prepareMemo: prepareMemo, defaultLength: defaultLength, randInt: randInt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ASP = api;
})(typeof window !== 'undefined' ? window : globalThis);
