(function () {
  'use strict';

  var DEFAULTS = { sep: '-', number: true, min: null, max: null };
  var STORE = 'asp:v1';
  var LANGS = { en: 'en', es: 'es', pt: 'pt-BR' };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (id) { return document.getElementById(id); };
  var pwEl = $('pw'), stage = $('stage'), statusEl = $('status'), statusText = $('statusText'), countEl = $('count');
  var sepInput = $('sep'), minInput = $('min'), maxInput = $('max'), errorEl = $('error'), sepHint = $('sepHint');

  // ---------- settings ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ sep: s.sep, number: s.number, min: s.min, max: s.max, lang: chosenLang })); } catch (e) {}
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
  var s = {
    sep: typeof saved.sep === 'string' ? saved.sep : DEFAULTS.sep,
    number: typeof saved.number === 'boolean' ? saved.number : DEFAULTS.number,
    min: saved.min || null,
    max: saved.max || null
  };
  var chosenLang = LANGS[saved.lang] ? saved.lang : null; // only set when the visitor picks one
  var lang = chosenLang || detectLang();
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
    document.querySelectorAll('.langs button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });

    // Honest numbers for the "why three words" paragraph, from the real list size.
    var n = ASP_WORDS[lang][5].length;
    var fmt = function (v, opts) { try { return new Intl.NumberFormat(LANGS[lang], opts).format(v); } catch (e) { return String(v); } };
    document.querySelector('[data-i18n="s2p"]').textContent = dict.s2p
      .replace('{words}', fmt(Math.round(n / 100) * 100))
      .replace('{combos}', fmt(Math.pow(n, 3) * 10, { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: 2 }));
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
    countEl.textContent = '· ' + t('chars', current.length);
    fit();
    if (animate && !reduceMotion && !document.hidden) scramble();
  }

  // The signature: the password always fills the line. Anybody's width axis
  // stretches short passwords and condenses long ones; only if it's still too
  // wide at the narrowest width does the size come down.
  function fit() {
    pwEl.style.fontSize = '';
    var avail = stage.clientWidth;
    pwEl.classList.toggle('stack', avail < 520);
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

  // Make a new password. `gesture` is true inside a user event, where
  // browsers allow writing to the clipboard.
  function regenerate(gesture) {
    var r = ASP.generate(s, ASP_WORDS[lang]);
    if (r.error) {
      showError(r.error === 'range' ? t('errRange') : t(r.error === 'tooShort' ? 'errTooShort' : 'errTooLong', r.n));
      if (current) return;
      // Nothing on screen yet (saved options can't be met): show a default one.
      r = ASP.generate({ sep: DEFAULTS.sep, number: DEFAULTS.number }, ASP_WORDS[lang]);
    } else {
      showError('');
    }
    render(r, true);
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
  function syncControls() {
    sepInput.value = s.sep;
    document.querySelectorAll('#sepChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.sep === s.sep)); });
    document.querySelectorAll('#numSeg .chip').forEach(function (c) { c.setAttribute('aria-checked', String((c.dataset.num === '1') === s.number)); });
    minInput.value = s.min || '';
    maxInput.value = s.max || '';
  }
  function changed() { save(); syncControls(); regenerate(true); }

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
  function readLen(input) {
    var v = parseInt(input.value, 10);
    if (isNaN(v)) return null;
    return Math.max(4, Math.min(64, v));
  }
  minInput.addEventListener('change', function () { s.min = readLen(minInput); changed(); });
  maxInput.addEventListener('change', function () { s.max = readLen(maxInput); changed(); });

  $('resetBtn').addEventListener('click', function () {
    s = { sep: DEFAULTS.sep, number: DEFAULTS.number, min: null, max: null };
    sepHint.hidden = true;
    changed();
  });
  document.querySelectorAll('.langs button').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = chosenLang = b.dataset.lang;
      save(); applyLang(); regenerate(true);
    });
  });

  $('copyBtn').addEventListener('click', function () { copy(); });
  $('newBtn').addEventListener('click', function () { regenerate(true); });
  pwEl.addEventListener('click', function () { copy(); });
  pwEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') copy(); });

  // Space makes a new password, unless the visitor is typing or on a control.
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || e.ctrlKey || e.metaKey || e.altKey) return;
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

  // ---------- start ----------
  syncControls();
  applyLang();
  regenerate(false);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
