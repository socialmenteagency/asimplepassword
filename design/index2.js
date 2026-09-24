// Design proposal page (index2): same generator as the live site, new presentation.
(function () {
  'use strict';

  var STORE = 'asp2:v1';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  // ---------- settings ----------
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) {}
  var s = {
    sep: typeof saved.sep === 'string' ? saved.sep : '-',
    number: typeof saved.number === 'boolean' ? saved.number : true,
    words: [3, 4, 5].indexOf(saved.words) > -1 ? saved.words : 3
  };
  function save() { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) {} }

  // 3 words is the default structure; 4 or 5 words become a minimum length
  // the generator meets with five-letter words.
  function options() {
    var num = s.number ? 1 : 0;
    var min = s.words === 3 ? null : 5 * s.words + s.sep.length * (s.words - 1 + num) + num;
    return { sep: s.sep, number: s.number, min: min };
  }

  var current = '', parts = [], copiedValue = null;

  // ---------- rendering ----------
  function partsHTML(list) {
    var out = '', open = false;
    list.forEach(function (p) {
      if (p.type === 'lower' || p.type === 'upper') { if (open) out += '</span>'; out += '<span class="g">'; open = true; }
      out += '<span class="' + p.type + '">' + p.text + '</span>';
    });
    return out + (open ? '</span>' : '');
  }

  function render(result) {
    current = result.password;
    parts = result.parts;
    var pw = $('#pw');
    pw.innerHTML = partsHTML(parts);
    pw.classList.toggle('long', current.length > 24);
    $('#inlinePw').textContent = current;
    $('#finalPw').textContent = current;
    $('#chkLength').textContent = current.length + ' characters';
    $('#optLength').textContent = 'Length: ' + current.length + ' characters';
    var has = { upper: true, lower: true, num: parts.some(function (p) { return p.type === 'num'; }), sym: /\S/.test(s.sep), len: true };
    $$('#checks li').forEach(function (li) {
      var ok = has[li.dataset.check];
      li.classList.toggle('off', !ok);
      li.querySelector('i').textContent = ok ? '✓' : '✗';
    });
    renderSteps();
  }

  // The "how one is made" steps rebuild the visitor's own password.
  function renderSteps() {
    var words = parts.filter(function (p) { return p.type === 'lower' || p.type === 'upper'; });
    var num = parts.filter(function (p) { return p.type === 'num'; })[0];
    var gap = '<span class="gap"></span>';
    var sep = s.sep ? '<span class="sep">' + s.sep + '</span>' : '';
    var build = {
      1: words.map(function (w) { return w.text.toLowerCase(); }).join(gap),
      2: words.map(function (w) { return w.text; }).join(gap),
      3: words.map(function (w) { return w.text; }).join(sep || ''),
      4: partsHTML(parts)
    };
    if (!num) build[4] = build[3];
    $$('.build').forEach(function (el) { el.innerHTML = build[el.dataset.step]; });
  }

  function regenerate(gesture) {
    render(ASP.generate(options(), ASP_WORDS.en));
    if (gesture) copy(); else setStatus(false);
    if (!reduceMotion && window.gsap) gsap.fromTo('#pw', { opacity: .3, y: 6 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out' });
  }

  // ---------- clipboard (only inside a user gesture) ----------
  function setStatus(ok, failed) {
    var el = $('#status');
    el.textContent = failed ? 'Couldn’t copy. Select it and copy by hand.' : ok ? 'Copied to your clipboard' : 'Tap anywhere to copy it';
    el.classList.toggle('ok', !!ok);
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }
  function copy() {
    var text = current;
    var done = function () { copiedValue = text; setStatus(true); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text) ? done() : setStatus(false, true); });
    } else {
      legacyCopy(text) ? done() : setStatus(false, true);
    }
  }

  // ---------- controls ----------
  function sync() {
    $$('#sepChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.sep === s.sep)); });
    $$('#numChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String((c.dataset.num === '1') === s.number)); });
    $$('#wordChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(Number(c.dataset.words) === s.words)); });
  }
  function changed() { save(); sync(); regenerate(true); }
  $$('#sepChips .chip').forEach(function (c) { c.addEventListener('click', function () { s.sep = c.dataset.sep; changed(); }); });
  $$('#numChips .chip').forEach(function (c) { c.addEventListener('click', function () { s.number = c.dataset.num === '1'; changed(); }); });
  $$('#wordChips .chip').forEach(function (c) { c.addEventListener('click', function () { s.words = Number(c.dataset.words); changed(); }); });

  $$('[data-action="copy"]').forEach(function (b) { b.addEventListener('click', copy); });
  $$('[data-action="new"]').forEach(function (b) { b.addEventListener('click', function () { regenerate(true); }); });
  $('#pw').addEventListener('click', copy);

  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, button, a')) return;
    e.preventDefault();
    regenerate(true);
  });
  function firstTouch() {
    document.removeEventListener('click', firstTouch, true);
    document.removeEventListener('keydown', firstTouch, true);
    if (copiedValue !== current) copy();
  }
  document.addEventListener('click', firstTouch, true);
  document.addEventListener('keydown', firstTouch, true);

  // ---------- marquee: real passwords in all three languages ----------
  function marqueeRow(sel, langs) {
    var html = '';
    for (var i = 0; i < 10; i++) {
      var r = ASP.generate({ sep: '-', number: true }, ASP_WORDS[langs[i % langs.length]]);
      html += '<span>' + r.parts.map(function (p) { return p.type === 'sep' || p.type === 'num' ? '<span class="s">' + p.text + '</span>' : p.text; }).join('') + '</span>';
    }
    $(sel + ' .marquee-track').innerHTML = html + html; // doubled for a seamless loop
  }
  marqueeRow('#row1', ['en', 'es', 'pt']);
  marqueeRow('#row2', ['pt', 'en', 'es']);

  // Honest count for the bento card, from the real list size.
  $('.visual-number span').textContent = Math.round(Math.pow(ASP_WORDS.en[5].length, 3) * 10 / 1e9);

  // ---------- carousel: passwords people invent ----------
  var slides = $$('.slide'), active = 0;
  function layoutDeck() {
    slides.forEach(function (el, i) {
      var rel = (i - active + slides.length) % slides.length;
      el.style.zIndex = String(slides.length - rel);
      el.style.opacity = rel > 2 ? '0' : String(1 - rel * .28);
      el.style.transform = 'translate(' + rel * 22 + 'px,' + rel * 22 + 'px) scale(' + (1 - rel * .05) + ')';
      el.setAttribute('aria-hidden', String(rel !== 0));
    });
    $('#slideCount').textContent = (active + 1) + ' / ' + slides.length;
  }
  $('#prevSlide').addEventListener('click', function () { active = (active - 1 + slides.length) % slides.length; layoutDeck(); });
  $('#nextSlide').addEventListener('click', function () { active = (active + 1) % slides.length; layoutDeck(); });
  layoutDeck();

  // ---------- start ----------
  sync();
  regenerate(false);

  // ---------- motion (GSAP) ----------
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.reveal', { y: 40, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out' });
  gsap.from('#pwCard', { y: 90, rotate: -9, opacity: 0, duration: 1.3, delay: .35, ease: 'power3.out' });
  gsap.to('.pw-card-inner', { y: -10, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  $$('.chapter-title, .statement, .final-title').forEach(function (el) {
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // Image scale and fade: visuals grow from 0.8 as they enter, then darken and fade to 0.2 as they leave.
  $$('.visual').forEach(function (el) {
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      .fromTo(el, { scale: .8, opacity: .5 }, { scale: 1, opacity: 1, ease: 'none', duration: .45 })
      .to(el, { duration: .2 })
      .to(el, { opacity: .2, filter: 'brightness(.55)', ease: 'none', duration: .35 });
  });

  // Scroll pinning: the title stays put on the left while the steps scroll on the right (wide screens).
  var mm = gsap.matchMedia();
  mm.add('(min-width: 1081px)', function () {
    var pin = $('.how-pin'), steps = $('#steps');
    ScrollTrigger.create({
      trigger: '.how-grid', start: 'top 140px',
      end: function () { return '+=' + Math.max(0, steps.offsetHeight - pin.offsetHeight); },
      pin: pin, pinSpacing: false
    });
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
