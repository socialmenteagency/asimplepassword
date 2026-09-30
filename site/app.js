(function () {
  'use strict';

  var DEFAULTS = { sep: '-', number: true, words: 3, max: null, memo: false };
  var STORE = 'asp:v1';
  var LANGS = { en: 'en', es: 'es', pt: 'pt-BR' };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (id) { return document.getElementById(id); };
  var pwEl = $('pw'), stage = $('stage'), statusEl = $('status'), statusText = $('statusText');
  var sepInput = $('sep'), maxInput = $('max'), errorEl = $('error'), sepHint = $('sepHint');

  // ---------- settings ----------
  // Every visit starts with the default options; only the language the
  // visitor picks is remembered.
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ lang: chosenLang })); } catch (e) {}
  }
  function detectLang() {
    var list = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).slice(0, 2).toLowerCase();
      if (LANGS[code]) return code;
    }
    return 'en';
  }

  var saved = load();
  var s = { sep: DEFAULTS.sep, number: DEFAULTS.number, words: DEFAULTS.words, max: DEFAULTS.max, memo: DEFAULTS.memo };
  var chosenLang = LANGS[saved.lang] ? saved.lang : null; // only set when the visitor picks one
  // /es/ and /pt/ are their own pages: the language is fixed by the page.
  // On / the visitor's pick wins, then the browser language.
  var pageLang = LANGS[document.documentElement.getAttribute('data-page-lang')] ? document.documentElement.getAttribute('data-page-lang') : null;
  var lang = pageLang || chosenLang || detectLang();
  var current = '', copiedValue = null;

  function t(key, n) { return (ASP_I18N[lang][key] || ASP_I18N.en[key]).replace('{n}', n); }

  // ---------- language ----------
  function applyLang() {
    document.documentElement.lang = LANGS[lang];
    var dict = ASP_I18N[lang];
    document.title = dict.title;
    document.querySelector('meta[name="description"]').setAttribute('content', dict.description);
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = dict[el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) { el.placeholder = dict[el.getAttribute('data-i18n-placeholder')]; });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) { el.title = dict[el.getAttribute('data-i18n-title')]; });
    $('memoInfo').setAttribute('aria-label', dict.memoInfo); $('memoPlay').setAttribute('aria-label', dict.memoPlay);
    $('vidPoster').setAttribute('src', '/media/memorable-' + lang + '.jpg');
    document.querySelectorAll('.langs a').forEach(function (a) {
      if (a.dataset.lang === lang) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    // Honest numbers for the "why three words" paragraph, from the real list size.
    var n = ASP_WORDS[lang][5].length;
    var fmt = function (v, opts) { try { return new Intl.NumberFormat(LANGS[lang], opts).format(v); } catch (e) { return String(v); } };
    document.querySelector('[data-i18n="s2p"]').textContent = dict.s2p
      .replace('{words}', fmt(Math.round(n / 100) * 100))
      .replace('{combos}', fmt(Math.pow(n, 3) * 10, { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: 2 }));
    // Our row in the comparison shows a sample in this language (found-PLANT-dance-3).
    var ours = document.querySelector('.cmp .ours code');
    if (ours) {
      var parts = dict.cmpSample.split('-');
      ours.innerHTML = parts.map(function (p, i) {
        return (i < parts.length - 1 ? '<span class="g">' + p + '</span><span class="sep">-</span>' : '<span class="num">' + p + '</span>');
      }).join('');
    }
    setStatus(copiedValue === current && current ? 'copied' : 'tapToCopy');
  }

  // ---------- rendering ----------
  function render(result, animate) {
    current = result.password;
    pwEl.textContent = '';
    // Each word and the separator after it form a group; on phones the
    // groups stack one per line. The number joins the last group.
    var group = null;
    result.parts.forEach(function (p) {
      if (p.type === 'lower' || p.type === 'upper') {
        group = document.createElement('span');
        group.className = 'g';
        pwEl.appendChild(group);
      }
      var span = document.createElement('span');
      span.className = p.type;
      span.textContent = p.text;
      group.appendChild(span);
    });
    updateChecks(result);
    fit();
    if (animate && !reduceMotion && !document.hidden) scramble();
  }

  // The checklist under the buttons follows the options: no number or no
  // separator turns that line into a cross.
  function updateChecks(result) {
    var has = {
      upper: true,
      lower: true,
      num: result.parts.some(function (p) { return p.type === 'num'; }),
      sym: /[^\s]/.test(s.sep),
      len: true
    };
    document.querySelectorAll('#checks li').forEach(function (li) {
      var ok = has[li.dataset.check];
      li.classList.toggle('off', !ok);
      li.querySelector('i').textContent = ok ? '✓' : '✗';
    });
    $('chkLength').textContent = t('chkLength', current.length);
  }

  // The signature: the password always fills the line. Anybody's width axis
  // stretches short passwords and condenses long ones; only if it's still too
  // wide at the narrowest width does the size come down.
  function fit() {
    pwEl.style.fontSize = '';
    var avail = stage.clientWidth;
    var lo = 62, hi = 125;
    var width = function (st) { pwEl.style.fontStretch = st + '%'; return pwEl.getBoundingClientRect().width; };
    if (width(lo) > avail) {
      var base = parseFloat(getComputedStyle(pwEl).fontSize);
      pwEl.style.fontSize = Math.floor(base * avail / width(lo) * 0.98) + 'px';
      return;
    }
    if (width(hi) <= avail) return;
    for (var i = 0; i < 12; i++) {
      var mid = (lo + hi) / 2;
      if (width(mid) <= avail) lo = mid; else hi = mid;
    }
    width(lo);
  }

  // Letters roll through random characters and settle left to right.
  function scramble() {
    var spans = Array.prototype.slice.call(pwEl.querySelectorAll('.lower, .upper, .num'));
    var finals = spans.map(function (sp) { return sp.textContent; });
    var start = performance.now(), total = finals.join('').length, pos = 0;
    var offsets = finals.map(function (f) { var o = pos; pos += f.length; return o; });
    function frame(now) {
      var done = true;
      spans.forEach(function (sp, i) {
        var f = finals[i], out = '';
        for (var c = 0; c < f.length; c++) {
          var settle = 90 + (offsets[i] + c) / total * 320;
          if (now - start >= settle) { out += f[c]; continue; }
          done = false;
          var pool = /\d/.test(f[c]) ? '0123456789' : /[A-Z]/.test(f[c]) ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'abcdefghijklmnopqrstuvwxyz';
          out += pool[Math.floor(Math.random() * pool.length)];
        }
        sp.textContent = out;
      });
      if (!done) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function showError(msg) {
    errorEl.textContent = msg || '';
    errorEl.hidden = !msg;
  }

  // "Make it memorable" draws from grammar pools (noun, verb, adjective),
  // split into length buckets the first time a language needs them.
  // Its data file is only fetched the first time the option is switched on.
  var memoPools = {}, memoScript = null;
  function memoReady() { return !!(window.ASP_MEMO && window.ASP_MEMO[lang]); }
  function loadMemo(done) {
    memoScript = document.createElement('script');
    memoScript.src = '/memo-' + lang + '.js?v=1';
    memoScript.addEventListener('load', done);
    // A failed load can be retried with the next click.
    memoScript.addEventListener('error', function () { memoScript.remove(); memoScript = null; });
    document.body.appendChild(memoScript);
  }
  function makeWith(o) {
    if (!o.memo) return ASP.generate(o, ASP_WORDS[lang]);
    memoPools[lang] = memoPools[lang] || ASP.prepareMemo(ASP_MEMO[lang]);
    return ASP.generateMemorable(o, memoPools[lang]);
  }
  function make() { return makeWith(s); }

  // Make a new password. `gesture` is true inside a user event, where
  // browsers allow writing to the clipboard.
  function regenerate(gesture) {
    var r = make();
    if (r.error) {
      showError(t('errTooShort', r.n));
      if (current) return;
      // Nothing on screen yet: show a default one.
      r = ASP.generate({ sep: DEFAULTS.sep, number: DEFAULTS.number, words: DEFAULTS.words }, ASP_WORDS[lang]);
    } else {
      showError('');
    }
    // No scramble on the first render: it would count as layout shift.
    render(r, gesture);
    pwEl.classList.remove('pop'); void pwEl.offsetWidth; pwEl.classList.add('pop');
    if (gesture) copy(); else setStatus('tapToCopy');
  }

  // ---------- clipboard ----------
  function setStatus(key) {
    statusText.textContent = t(key);
    statusEl.classList.toggle('ok', key === 'copied');
  }
  function legacyCopy(text) {
    var active = document.activeElement, ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (active && active.focus) active.focus({ preventScroll: true });
    return ok;
  }
  // Only ever called inside a user gesture: a copy attempted without one
  // makes Chrome show a clipboard permission prompt.
  function copy() {
    var text = current;
    var done = function () { copiedValue = text; if (text === current) setStatus('copied'); };
    var fail = function () { setStatus('copyFailed'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () {
        legacyCopy(text) ? done() : fail();
      });
    } else {
      legacyCopy(text) ? done() : fail();
    }
  }

  // ---------- controls ----------
  var SEP_CHIPS = ['-', '_', '.', ''];
  function syncControls() {
    // The "other" field only shows a separator the chips don't offer.
    var custom = SEP_CHIPS.indexOf(s.sep) === -1;
    if (document.activeElement !== sepInput) sepInput.value = custom ? s.sep : '';
    sepInput.classList.toggle('on', custom);
    document.querySelectorAll('#sepChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(!custom && c.dataset.sep === s.sep)); });
    document.querySelectorAll('#numSeg .chip').forEach(function (c) { c.setAttribute('aria-checked', String((c.dataset.num === '1') === s.number)); });
    document.querySelectorAll('#wordSeg .chip').forEach(function (c) { c.setAttribute('aria-checked', String(Number(c.dataset.words) === s.words)); });
    document.querySelectorAll('#memoSeg .chip').forEach(function (c) { c.setAttribute('aria-checked', String((c.dataset.memo === '1') === s.memo)); });
    // Memorable passwords need at least 3 words.
    document.querySelector('#wordSeg [data-words="2"]').disabled = s.memo;
    if (document.activeElement !== maxInput) maxInput.value = s.max || '';
  }
  function changed() { syncControls(); regenerate(true); }

  sepInput.addEventListener('input', function () {
    var clean = sepInput.value.replace(/[\p{L}\p{N}]/gu, '');
    sepHint.hidden = clean === sepInput.value;
    s.sep = clean;
    changed();
  });
  document.querySelectorAll('#sepChips .chip').forEach(function (c) {
    c.addEventListener('click', function () { s.sep = c.dataset.sep; sepHint.hidden = true; changed(); });
  });
  document.querySelectorAll('#numSeg .chip').forEach(function (c) {
    c.addEventListener('click', function () { s.number = c.dataset.num === '1'; changed(); });
  });
  document.querySelectorAll('#wordSeg .chip').forEach(function (c) {
    c.addEventListener('click', function () { s.words = Number(c.dataset.words); changed(); });
  });
  var memoWanted = false;
  function setMemo() {
    s.memo = memoWanted;
    if (s.memo && s.words < 3) s.words = 3;
    changed();
  }
  document.querySelectorAll('#memoSeg .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      memoWanted = c.dataset.memo === '1';
      if (!memoWanted || memoReady()) setMemo();
      else if (!memoScript) loadMemo(function () { if (memoWanted) setMemo(); });
    });
  });
  // Max length: two digits at most; empty means no limit.
  maxInput.addEventListener('input', function () { maxInput.value = maxInput.value.replace(/\D/g, '').slice(0, 2); });
  maxInput.addEventListener('change', function () {
    var v = parseInt(maxInput.value, 10);
    s.max = isNaN(v) || v < 1 ? null : v;
    changed();
  });

  // The language links go to /, /es/ or /pt/; the pick is remembered for /.
  document.querySelectorAll('.langs a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      chosenLang = a.dataset.lang;
      save();
      if (a.dataset.lang === lang && a.pathname === location.pathname) e.preventDefault();
    });
  });

  $('copyBtn').addEventListener('click', function () { copy(); });
  $('newBtn').addEventListener('click', function () { regenerate(true); });
  pwEl.addEventListener('click', function () { copy(); });
  pwEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') copy(); });

  // Space makes a new password, unless the visitor is typing or on a control.
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || e.ctrlKey || e.metaKey || e.altKey) return;
    if ($('videoDlg').open) return;
    if (e.target.closest && e.target.closest('input, textarea, select, button, summary, a')) return;
    e.preventDefault();
    regenerate(true);
  });

  // First interaction anywhere copies what's on screen. Browsers only allow
  // clipboard writes inside a user gesture, so this is the earliest moment.
  function firstTouch() {
    document.removeEventListener('click', firstTouch, true);
    document.removeEventListener('keydown', firstTouch, true);
    if (copiedValue !== current) copy();
  }
  document.addEventListener('click', firstTouch, true);
  document.addEventListener('keydown', firstTouch, true);

  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(fit, 60); });

  // "Make it memorable": the ? opens its FAQ answer; ▶ and the FAQ button play the film in this page's language.
  $('memoInfo').addEventListener('click', function (e) {
    e.preventDefault();
    var d = $('faqMemo'); d.open = true;
    d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    d.querySelector('summary').focus({ preventScroll: true });
  });
  var dlg = $('videoDlg'), vid = $('memoVideo');
  document.querySelectorAll('[data-video]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var src = '/media/memorable-' + lang + '.mp4';
      if (vid.getAttribute('src') !== src) { vid.setAttribute('src', src); vid.setAttribute('poster', '/media/memorable-' + lang + '.jpg'); }
      dlg.showModal(); vid.currentTime = 0; var p = vid.play(); if (p && p.catch) p.catch(function () {});
    });
  });
  function closeVideo() { vid.pause(); if (dlg.open) dlg.close(); }
  $('videoClose').addEventListener('click', closeVideo);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeVideo(); });   // click on the backdrop
  dlg.addEventListener('close', function () { vid.pause(); });

  // ---------- agents ----------
  // WebMCP (experimental in browsers): an agent visiting the page can call this tool
  // instead of clicking. It only returns a password; the page itself doesn't change.
  var mcp = navigator.modelContext || document.modelContext;
  if (mcp && mcp.registerTool) {
    mcp.registerTool({
      name: 'generate_password',
      description: 'Make a random, easy-to-remember password from simple words plus a digit, like pareja-VENDE-grito-6. It is made in this browser with a secure random generator and sent nowhere. Use it whenever you need a password for an account you are signing up for. For the user\'s own bank or email, tell them to open this page and make it themselves, so no AI ever sees it.',
      inputSchema: {
        type: 'object',
        properties: {
          words: { type: 'integer', minimum: 2, maximum: 5, description: 'How many words. Default 3; use 4 or 5 for accounts that matter.' },
          separator: { type: 'string', maxLength: 3, description: 'Between words: up to 3 symbols, no letters or digits. Default "-"; "" for none.' },
          number: { type: 'boolean', description: 'End with a digit. Default true.' },
          max_length: { type: 'integer', minimum: 1, maximum: 99, description: 'Longest allowed password, if the service limits it. Words get shorter to fit.' },
          memorable: { type: 'boolean', description: 'Arrange the words as a tiny sentence (noun, verb, noun) that is easier to remember. Default false.' }
        }
      },
      annotations: { readOnlyHint: true },
      execute: function (a) {
        a = a || {};
        var o = { words: a.words == null ? 3 : Number(a.words), sep: a.separator == null ? '-' : String(a.separator), number: a.number !== false, max: a.max_length ? Number(a.max_length) : null, memo: a.memorable === true };
        if (!(o.words >= 2 && o.words <= 5) || o.words % 1) return 'Error: words must be 2, 3, 4 or 5.';
        if (o.sep.length > 3 || /[\p{L}\p{N}\s]/u.test(o.sep)) return 'Error: separator must be up to 3 symbols, with no letters, digits or spaces.';
        if (o.max && !(o.max >= 1 && o.max <= 99)) return 'Error: max_length must be from 1 to 99.';
        return new Promise(function (resolve) {
          var go = function () { var r = makeWith(o); resolve(r.error ? 'Error: ' + t('errTooShort', r.n) : r.password); };
          if (!o.memo || memoReady()) return go();
          setTimeout(function () { resolve('Error: could not load the word data.'); }, 10000);
          if (memoScript) memoScript.addEventListener('load', go); else loadMemo(go);
        });
      }
    });
  }

  // ---------- start ----------
  syncControls();
  applyLang();
  regenerate(false);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
