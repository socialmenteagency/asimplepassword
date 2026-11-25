# Picture-first pools for "Make it memorable" (3-nov-2026, Rafael): words you can
# picture, so `brave-APPLE-dances-3` reads like a tiny cartoon.
#
#   python3 picture.py gen      NaN writes concrete nouns, verbs and adjectives by topic
#   python3 picture.py rate     NaN rates every candidate (new words + the old memo pools)
#   python3 picture.py safety   two models flag words that could offend or upset; either flag drops it
#   python3 picture.py adjcheck ES/PT only: is each adjective pair a real adjective that follows a noun?
#   python3 picture.py build    writes site/memo-{en,es,pt}.js and picture/report.json
#
# Every answer is cached in picture/<stage>/, so re-running a stage makes no new calls.
# No one reads the full lists by hand (Rafael, 3-nov): an odd pairing gets regenerated
# on the page. Only the flagged words (picture/flagged-*.txt) get a look.
import glob, json, math, os, re, sys
sys.path.insert(0, os.path.expanduser('~/.nan-jobs'))
from nanclient import chat_json, pmap
from wordfreq import zipf_frequency

JOB = 'asp-picture'
OUT = 'picture'
LANGS = {'en': 'English', 'es': 'Spanish (Latin American, neutral)', 'pt': 'Brazilian Portuguese'}
WORD = re.compile(r'[a-z]{3,8}')

# Slot letters: N noun, V verb with an object (kicks), S verb on its own (dances), A adjective.
# Memorable: EN adjective first, ES/PT adjective after its noun (manzana-VALIENTE-baila).
ORDER = {
    'en': {2: 'NS', 3: 'ANS', 4: 'ANVN', 5: 'ANVAN'},
    'es': {2: 'NS', 3: 'NAS', 4: 'NAVN', 5: 'NAVNA'},
    'pt': {2: 'NS', 3: 'NAS', 4: 'NAVN', 5: 'NAVNA'},
}
# "Make it memorable" off, 3 words: a noun-VERB-noun scene (other word counts stay random site words).
PLAIN = {3: 'NVN'}

# Read by hand on 23-sep-2026 for the old pools; still never allowed in a memorable password.
MEMO_DROP = {
    'en': set('pregnant manly girly pious chokes scalps whacks bleeds strips robs mugs heists bribes cheats bullies '
              'arrests cons crooks exiles harms hurts sues trusses polish '
              'victim injury pain filth flesh choke bribe cheat crook bully suspect bra madam creep freak gland lymph colon fatty'.split()),
    'es': set('cutre guay pare yerra zafa idea basa muela lame mete chileno chino cubano europeo italiano romano ruso turco belga checo griego oriental vasco'.split()),
    'pt': set('acorde cuenta bases arca pira geme sola mola rala roga estufa gere come carioca europeu italiana italiano latino mexicano russo turco belga grego persa sueco'.split()),
}
# 3-nov-2026: slang the safety models let through, checked against a list of known double meanings.
# Mostly verbs, where a sentence makes the second meaning plain.
MEMO_DROP['en'] |= set('screws bangs blows rubs stiff moist rubber'.split())
MEMO_DROP['es'] |= set('chorizo'.split())
MEMO_DROP['pt'] |= set('rosca pirulito peito'.split())

NOUN_TOPICS = [
    'farm animals', 'pets', 'wild animals', 'sea animals and fish', 'birds', 'insects, bugs and small creatures',
    'friendly fantasy creatures and dinosaurs', 'fruits', 'vegetables', 'sweets, desserts and candy', 'breakfast foods',
    'snacks and fast food', 'dishes and meals', 'drinks without alcohol', 'bread and bakery', 'spices, sauces and ingredients',
    'furniture', 'kitchen tools, pots and dishes', 'bathroom things', 'bedroom things', 'home appliances and gadgets',
    'cleaning tools', 'clothes', 'shoes, hats and gloves', 'accessories and jewelry', 'family members and people',
    'jobs and professions', 'storybook characters (pirate, wizard, knight, robot, fairy, clown)', 'buildings',
    'places in a town', 'rooms and parts of a house', 'nature and landscapes', 'plants and flowers', 'trees',
    'rocks, gems and materials', 'weather and sky', 'space', 'vehicles', 'boats and aircraft', 'toys',
    'games and sports equipment', 'musical instruments', 'school and office things', 'tools and hardware',
    'garden things', 'party and holiday things', 'containers (box, jar, basket, bucket)',
    'face, hands and feet (nose, ear, elbow, thumb)', 'camping and beach things', 'art and craft supplies',
    'circus, fair and theater', 'castles and knights', 'shapes and small everyday objects', 'electronics and machines',
    'sewing and knitting', 'farm and countryside', 'pirates and the ocean', 'playground and park',
    # Second round (more nouns you can picture)
    'zoo animals', 'baby animals', 'reptiles, frogs and pond life', 'jungle and rainforest', 'desert', 'snow and the arctic',
    'mountains, rivers and lakes', 'seashore and tide pools', 'things in a supermarket', 'things in a toolbox',
    'things at a birthday party', 'things in a classroom', 'things on a desk', 'baby things', 'picnic', 'winter clothes',
    'summer and holidays', 'nuts, seeds and grains', 'cheese, milk and eggs', 'kitchen appliances',
    'things on the street (bench, lamp, sign)', 'things in a park', 'hats and headwear', 'bags and luggage',
    'things made of paper', 'things made of wood', 'things made of metal', 'soft and fluffy things', 'round things',
    'long thin things', 'things with wheels', 'things that fly', 'things that float', 'costumes and dress-up',
    'fairy tales and magic', 'typical foods and sweets of Latin America and Brazil', 'tropical fruits and plants',
    'market stalls and shops', 'cakes, cookies and pastries', 'tiny things (button, bead, crumb, pebble)',
]
VERB_TOPICS = [
    'moving the whole body (jumps, spins, crawls)', 'sounds and voice (sings, giggles, snores, whistles)',
    'face and feelings (winks, smiles, blushes, yawns)', 'cooking (bakes, stirs, peels, fries)', 'cleaning and housework',
    'sports and play', 'using the hands (grabs, pats, squeezes, tickles)', 'art and making things (paints, knits, glues, carves)',
    'getting around (drives, rides, sails, skates)', 'animal actions (barks, purrs, hops, pecks)',
    'water, air and weather (splashes, floats, melts, sparkles)', 'eating and drinking', 'music and dance',
    'carrying and moving things (pushes, lifts, drops, throws)', 'gardening and farming', 'school and office (writes, reads, counts, stamps)',
    # Second round
    'things you do with a ball', 'in the bathroom (brushes, rinses, scrubs)', 'with food on the table (slurps, munches, dunks)',
    'with paper (folds, crumples, tears, cuts)', 'with water (pours, sprinkles, soaks, dives)', 'with tools (hammers, saws, drills)',
    'with clothes (wears, buttons, zips, ties)', 'with a pet (feeds, walks, pets, brushes)', 'noisy actions (honks, rattles, bangs, buzzes)',
    'moving like an animal (slithers, waddles, gallops, scurries)', 'silly actions (tickles, wiggles, juggles, wobbles)',
    'party actions (wraps, blows, claps, cheers)', 'snow and beach actions (sleds, digs, builds, surfs)',
    'body actions (nods, shrugs, stomps, kneels)', 'going on a trip (packs, waves, climbs, rows)', 'finding and hiding (hides, peeks, sniffs, spots)',
]
ADJ_TOPICS = [
    'colors and patterns (spotted, striped, purple)', 'sizes and shapes', 'textures and how things feel',
    'moods and feelings (happy, grumpy, sleepy)', 'personality (brave, shy, sneaky, silly)', 'temperature and weather (frozen, sunny, windy)',
    'looks (shiny, hairy, messy, fancy)', 'sounds (loud, quiet, squeaky)', 'tastes and smells (sweet, spicy, salty)',
    'states (hungry, wet, dizzy, busy, sticky)', 'age and condition (tiny, ancient, dusty, new)', 'speed and energy (fast, lazy, wild, bouncy)',
    # Second round
    'funny looks (wobbly, lumpy, goofy)', 'how food is cooked or served (crispy, toasted, frozen)', 'materials (wooden, woolly, leafy)',
    'how an animal looks (furry, spotted, scaly)', 'how a cartoon character feels (proud, jumpy, cheerful)', 'how a room looks (tidy, cozy, dusty)',
    'how clothes and hair look (baggy, frilly, curly)', 'light and brightness (glowing, gleaming, dim)', 'nature (muddy, sandy, mossy)',
    'party and fun (festive, sparkly, noisy)', 'magic and fairy tales (enchanted, golden, secret)', 'strength and size (mighty, huge, puny)',
]
RULES = ('Only common words a 10-year-old knows. Spelled with only the letters a-z: skip any word that needs an accent, '
         'tilde, n with tilde, c with cedilla, a hyphen or a space (do not drop the accent, skip the word). 3 to 8 letters. '
         'No names, no brands, nothing offensive, sexual, violent, scary or sad.')


def ask(name, prompt, model='deepseek-v4-flash', temperature=0.1, max_tokens=8000):
    path = f'{OUT}/{name}.json'
    if os.path.exists(path):
        return json.load(open(path))
    kw = {'reasoning': 'minimal' if model.startswith('glm') else 'none'}
    obj, res = chat_json([{'role': 'user', 'content': prompt}], job=JOB, model=model, temperature=temperature,
                         max_tokens=max_tokens, json_mode=True, **kw)
    if isinstance(obj, list):
        obj = {'items': obj}
    if not isinstance(obj, dict):
        print('FAIL', name, res.get('status'), res.get('content', '')[:120].replace('\n', ' '), flush=True)
        return None
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(obj, open(path, 'w'), ensure_ascii=False)
    return obj


def old_pools(lang):
    """The pools live on the site before this rebuild (read once, then cached)."""
    path = f'{OUT}/old-{lang}.json'
    if not os.path.exists(path):
        src = open(f'../../site/memo-{lang}.js').read()
        pools = {c: re.search(c + r': `([^`]*)`', src)[1].split() for c in 'NVA'}
        os.makedirs(OUT, exist_ok=True)
        json.dump(pools, open(path, 'w'))
    return json.load(open(path))


def gen():
    tasks = []
    for lang, name in LANGS.items():
        g = '' if lang == 'en' else ' with its gender'
        nshape = '{"words": ["apple", ...]}' if lang == 'en' else '{"words": [["manzana", "f"], ["gato", "m"], ...]}'
        for i, t in enumerate(NOUN_TOPICS):
            tasks.append((f'gen/{lang}-n{i:02d}', f'List 120 different {name} nouns{g} in the topic: {t}. Each one a concrete '
                          f'thing a child can draw, in the singular. {RULES} Answer JSON only: {nshape}'))
        for i, t in enumerate(VERB_TOPICS):
            ex = {'en': '["dance", "dances", 1, 0], ["kick", "kicks", 0, 1], ["paint", "paints", 1, 1]',
                  'es': '["bailar", "baila", 1, 0], ["patear", "patea", 0, 1], ["pintar", "pinta", 1, 1]',
                  'pt': '["pular", "pula", 1, 0], ["chutar", "chuta", 0, 1], ["pintar", "pinta", 1, 1]'}[lang]
            tasks.append((f'gen/{lang}-v{i:02d}', f'List 80 different {name} verbs about: {t}. Each one a visible physical action '
                          'you can picture a cartoon character doing. Give the infinitive and the present tense "he/she does it" '
                          'form; that form must follow the rules: ' + RULES + ' Then 1 or 0: does it read well with no object '
                          '("the panda dances"), and does it read well with an object ("the panda kicks the pizza")? '
                          f'Answer JSON only: {{"verbs": [{ex}, ...]}}'))
        for i, t in enumerate(ADJ_TOPICS):
            if lang == 'en':
                shape, extra = '{"adjectives": ["brave", ...]}', ''
            else:
                shape = '{"adjectives": [["dormido", "dormida"], ["feliz", "feliz"], ...]}'
                extra = (' Give the masculine and the feminine form; both must follow the rules and have the same number '
                         'of letters (dormido/dormida); repeat a one-form adjective (feliz/feliz). Skip adjectives whose '
                         'two forms differ in length.')
            tasks.append((f'gen/{lang}-a{i:02d}', f'List 80 different {name} adjectives about: {t}, that vividly describe how a '
                          f'cartoon character or thing looks or feels. {RULES}{extra} Answer JSON only: {shape}'))
    pmap(lambda t: ask(t[0], t[1], temperature=0.6), tasks, workers=5)


def candidates(lang):
    """Every word to rate: generated words plus the old pools. Returns {'N': {w: g}, 'V': set, 'A': {m: f}}."""
    N, V, A = {}, set(), {}
    old = old_pools(lang)
    for w in old['N']: N.setdefault(w, '')
    for w in old['V']: V.add(w)
    for w in old['A']: A.setdefault(w, w)
    for f in glob.glob(f'{OUT}/gen/{lang}-*.json'):
        d = json.load(open(f))
        kind = f.rsplit('-', 1)[1][0]
        for x in d.get({'n': 'words', 'v': 'verbs', 'a': 'adjectives'}[kind]) or d.get('items') or []:
            try:
                if kind == 'n':
                    w, g = (x, '') if isinstance(x, str) else (x[0], x[1] if len(x) > 1 else '')
                    w = w.strip().lower()
                    if WORD.fullmatch(w): N.setdefault(w, g)
                elif kind == 'v':
                    form = x[1].strip().lower()
                    if WORD.fullmatch(form): V.add(form)
                else:
                    m, fem = (x, x) if isinstance(x, str) else (x[0], x[1] if len(x) > 1 else x[0])
                    m, fem = m.strip().lower(), fem.strip().lower()
                    if WORD.fullmatch(m) and WORD.fullmatch(fem) and len(m) == len(fem): A.setdefault(m, fem)
            except (IndexError, AttributeError, TypeError):
                continue
    return N, V, A


RATE = {
    'N': ('NOUNS', 'For each word give [picture, gender, check]. picture 1-5: how easy it is to picture as a concrete thing '
          'in a silly cartoon scene. 5 = a child draws it in 5 seconds (apple, panda, chair, pizza, robot, grandma). '
          '4 = concrete and familiar but less iconic (barn, ladder, helmet). 3 = concrete but vague or technical (alloy, annex). '
          '2 = a role, institution or mostly abstract (agency, budget). 1 = abstract (case, area). '
          'gender: "m" or "f" in Spanish/Portuguese, "-" in English. '
          'check: "ok", or "bad" if it is not a real, correctly spelled SINGULAR noun in this language exactly as written '
          '(a missing accent like "camion" for "camión", a plural, a verb form, a name or brand, a word from another '
          'language), or most 10-year-olds would not know it. Answer JSON only: {"word": [5, "m", "ok"], ...}'),
    'V': ('verb forms (present tense, "he/she does it")', 'For each form give [picture, alone, object, check]. '
          'picture 1-5: how easy it is to picture a cartoon character doing it (5: dances, kicks, sneezes; 1: involves, proves). '
          'alone 1/0: it reads well with no object ("the panda dances"). object 1/0: it reads well with an object '
          '("the panda kicks the pizza"). check: "ok", or "bad" if it is not exactly the correct present tense '
          'he/she form of a real verb, spelled correctly as written (no missing accent), or it reads first as a noun '
          '(papers, stations, mills), or most 10-year-olds would not know it. Answer JSON only: {"form": [5, 1, 0, "ok"], ...}'),
    'A': ('adjectives', 'For each adjective give [vivid, check]. vivid 1-5: how vividly it describes how a cartoon character '
          'or thing looks or feels. 5 = instantly picturable (sleepy, grumpy, tiny, fuzzy, brave, giant, shiny, sneaky). '
          '3 = okay but flat (old, plain, neat). 1 = abstract or not visual (precious, annual, patient). '
          'check: "ok", or "bad" if it is not a real, correctly spelled adjective as written (for Spanish/Portuguese '
          'the two forms are masculine/feminine and both must be right, with no missing accent), or most 10-year-olds would '
          'not know it. Answer JSON only, keyed by the first form: {"word": [5, "ok"], ...}'),
}


def rate():
    tasks = []
    for lang, name in LANGS.items():
        N, V, A = candidates(lang)
        lists = {'N': sorted(N), 'V': sorted(V), 'A': [m if lang == 'en' else f'{m}/{A[m]}' for m in sorted(A)]}
        for kind, ws in lists.items():
            what, rubric = RATE[kind]
            done = ratings(lang, kind)
            ws = [w for w in ws if w.split('/')[0] not in done]
            for i in range(0, len(ws), 100):
                tasks.append((f'rate/{lang}-{kind}-{ws[i].split("/")[0]}-{len(ws)}',
                              f'These are {name} {what} for random memorable passwords like "brave-APPLE-dances". {rubric} '
                              'Include every item exactly once.\nItems: ' + ' '.join(ws[i:i + 100])))
        print(lang, {k: len(v) for k, v in lists.items()}, flush=True)
    pmap(lambda t: ask(t[0], t[1]), tasks, workers=5)


def ratings(lang, kind):
    out = {}
    for f in glob.glob(f'{OUT}/rate/{lang}-{kind}-*.json'):
        for k, v in json.load(open(f)).items():
            out[k.strip().lower().split('/')[0]] = v
    return out


def zipf(w, lang):
    return zipf_frequency(w, lang)


# Frequency floors: wordfreq knowing the exact a-z spelling weeds out misspellings and rare words.
FLOOR = {'N': 2.0, 'V': 1.5, 'A': 1.5}
# Lowest picture score kept: nouns must be easy to draw; verbs and adjectives may be a bit flatter
# (talks, curious), or the pools get too small and the passwords too easy to guess.
PICK = {'N': 4, 'V': 3, 'A': 3}
ACCENTS = {'a': 'áâãà', 'e': 'éê', 'i': 'í', 'o': 'óôõ', 'u': 'úü', 'n': 'ñ', 'c': 'ç'}


def stripped(w, lang):
    """An accent-stripped misspelling: the same word with one accent mark is clearly more common
    (camion/camión, cafe/café, chapeu/chapéu)."""
    if lang == 'en': return False
    z = zipf(w, lang)
    return any(zipf(w[:i] + a + w[i + 1:], lang) > z + 0.3 for i, ch in enumerate(w) for a in ACCENTS.get(ch, ''))


def survivors(lang):
    """Words that pass the rating, spelling and frequency checks (before the safety pass)."""
    block = set(w for line in open('blocklist.txt') if not line.startswith('#') for w in line.split()) | MEMO_DROP[lang]
    N, V, A = candidates(lang)
    rn, rv, ra = ratings(lang, 'N'), ratings(lang, 'V'), ratings(lang, 'A')
    out = {'N': {}, 'V': set(), 'S': set(), 'A': {}}
    for w in N:
        r = rn.get(w)
        try:
            ok = r[2] == 'ok' and int(r[0]) >= PICK['N'] and (lang == 'en' or r[1] in ('m', 'f'))
        except (TypeError, IndexError, ValueError):
            ok = False
        if ok and w not in block and zipf(w, lang) >= FLOOR['N'] and not stripped(w, lang):
            out['N'][w] = r[1] if lang != 'en' else '-'
    for w in V:
        r = rv.get(w)
        try:
            ok = r[3] == 'ok' and int(r[0]) >= PICK['V']
        except (TypeError, IndexError, ValueError):
            ok = False
        if not ok or w in block or zipf(w, lang) < FLOOR['V'] or stripped(w, lang): continue
        if int(r[1]) == 1: out['S'].add(w)
        if int(r[2]) == 1: out['V'].add(w)
    for m, f in A.items():
        r = ra.get(m)
        try:
            ok = r[1] == 'ok' and int(r[0]) >= PICK['A']
        except (TypeError, IndexError, ValueError):
            ok = False
        if (ok and m not in block and f not in block and min(zipf(m, lang), zipf(f, lang)) >= FLOOR['A']
                and not stripped(m, lang) and not stripped(f, lang) and adjective_ok(lang, m)):
            out['A'][m] = f
    return out


# 24-nov-2026: the ES/PT adjective lists had nouns (queso, sopa, tofu) and made-up feminine forms
# (higo|higa, caldo|calda), which read as broken Spanish (gato-TOFU-baila). English is left alone:
# a noun before a noun is natural there (stone apple).
ADJCHECK = ('These are {name} words proposed as ADJECTIVES for passwords like "gato-DORMIDO-baila": a noun, then an '
            'adjective that agrees with it, then a verb. Each item is masculine/feminine. Answer 1 if BOTH forms are '
            'real, correctly spelled adjectives that can follow a noun directly (un gato dormido, una pizza dormida); '
            'colors used that way count (un gato rosa, una pizza azul). Answer 0 if it is really a noun (queso, sopa, '
            'tofu, piedra), the feminine form is wrong or made up (higo/higa), or it needs "de" to describe a thing. '
            'Answer JSON only, keyed by the masculine form, every item once: {{"word": 1, ...}}\nItems: {items}')


def adjcheck():
    tasks = []
    for lang, name in LANGS.items():
        if lang == 'en': continue
        _, _, A = candidates(lang)
        items = [f'{m}/{A[m]}' for m in sorted(A)]
        for i in range(0, len(items), 100):
            tasks.append((f'adjcheck/{lang}-{i // 100:03d}', ADJCHECK.format(name=name, items=' '.join(items[i:i + 100]))))
        print(lang, len(items), flush=True)
    pmap(lambda t: ask(t[0], t[1]), tasks, workers=5)


_ADJ = {}
def adjective_ok(lang, m):
    """ES/PT: kept only if the adjcheck pass answered 1 (no answer yet: kept, so older builds still run)."""
    if lang == 'en': return True
    if lang not in _ADJ:
        _ADJ[lang] = {}
        for f in glob.glob(f'{OUT}/adjcheck/{lang}-*.json'):
            for k, v in json.load(open(f)).items(): _ADJ[lang][k.strip().lower().split('/')[0]] = v
    v = _ADJ[lang].get(m)
    return v is None or str(v) == '1'


SAFETY = ('These {name} words may appear in random passwords like "brave-APPLE-dances". Rate EVERY word 0-3 for how '
          'likely it is to offend, embarrass or upset someone who sees it in their own password. '
          '0 = fine, even if it is a little grumpy, scary or rough in a cartoon (apple, hill, kicks, bites, storm, needle, '
          'dart, sword, scream, grumpy, old, smelly). '
          '1 = a far-fetched or mild association most people would not notice (pries, peels, string, cherry). '
          '2 = many people would find it off: it mocks someone\'s body, age or mind (chubby, puny, skinny, dumb); it has a '
          'common vulgar or sexual double meaning in some country where this language is spoken; religion, politics, '
          'ethnic or national labels; crime, drugs, alcohol, guns and bombs, death, illness, injury. '
          '3 = clearly vulgar, sexual, insulting or violent, or its main slang meaning somewhere is vulgar '
          '(nipple, slut, a slur; Spanish coger, concha, bicho, paja, zorra; Portuguese pau, rola, pinto). '
          'Answer JSON only, every word once: {{"word": 0, ...}}\nWords: {words}')
DROP_AT = 2   # a word either model rates 2 or 3 is dropped


def safety():
    tasks = []
    for lang, name in LANGS.items():
        s = survivors(lang)
        ws = sorted(set(s['N']) | s['V'] | s['S'] | set(s['A']) | set(s['A'].values()))
        for model in ('deepseek-v4-flash', 'glm5.3-flash'):
            for i in range(0, len(ws), 150):
                tasks.append((f'safety2/{lang}-{model[:4]}-{i // 150:03d}', SAFETY.format(name=name, words=' '.join(ws[i:i + 150])), model))
        print(lang, len(ws), flush=True)
    pmap(lambda t: ask(t[0], t[1], model=t[2]), tasks, workers=6)
    # A batch the provider's filter blocks (or that doesn't parse) is split until each piece
    # answers; a single word that is still blocked counts as flagged.
    def retry(t):
        name, prompt, model = t
        if os.path.exists(f'{OUT}/{name}.json'): return
        words = prompt.rsplit('Words: ', 1)[1].split()
        lang, name_ = name.split('/')[1].split('-')[0], LANGS[name.split('/')[1].split('-')[0]]
        def solve(ws, tag):
            if ask(f'{name}-{tag}', SAFETY.format(name=name_, words=' '.join(ws)), model=model) is not None: return
            if len(ws) == 1:
                json.dump({ws[0]: 3}, open(f'{OUT}/{name}-{tag}.json', 'w')); return  # blocked by the provider filter
            h = len(ws) // 2
            solve(ws[:h], tag + 'a'); solve(ws[h:], tag + 'b')
        solve(words, 'p')
    pmap(retry, tasks, workers=6)


def flagged(lang):
    """Words either model rated DROP_AT or more: {word: [score, ...]}."""
    scores = {}
    for f in glob.glob(f'{OUT}/safety2/{lang}-*.json'):
        for w, v in json.load(open(f)).items():
            try: scores.setdefault(w.strip().lower(), []).append(int(v))
            except (TypeError, ValueError): scores.setdefault(w.strip().lower(), []).append(DROP_AT)
    return {w: v for w, v in scores.items() if max(v) >= DROP_AT}


def build():
    report = {}
    for lang in LANGS:
        s, flags = survivors(lang), flagged(lang)
        N = {w: g for w, g in s['N'].items() if w not in flags}
        V = sorted(w for w in s['V'] if w not in flags)
        S = sorted(w for w in s['S'] if w not in flags)
        A = {m: f for m, f in s['A'].items() if m not in flags and f not in flags}
        with open(f'{OUT}/flagged-{lang}.txt', 'w') as fh:
            for w in sorted(flags):
                fh.write(f'{w}\t{flags[w]}\n')
        tok = sorted(m if m == f else f'{m}|{f}' for m, f in A.items())
        data = {'N': sorted(N), 'V': V, 'S': S, 'A': tok}
        if lang != 'en':
            data['F'] = sorted(w for w, g in N.items() if g == 'f')
        with open(f'../../site/memo-{lang}.js', 'w') as fh:
            fh.write(f'// {lang} grammar pools for "Make it memorable": N noun, V verb with an object, S verb on its own,\n'
                     '// A adjective (ES/PT: masculine|feminine), F feminine nouns. Built by tools/words/picture.py.\n')
            fh.write(f'(window.ASP_MEMO = window.ASP_MEMO || {{}}).{lang} = {{\n'
                     f'  order: {json.dumps({str(k): v for k, v in ORDER[lang].items()})},\n'
                     f'  plain: {json.dumps({str(k): v for k, v in PLAIN.items()})},\n')
            keys = [k for k in ('N', 'F', 'V', 'S', 'A') if k in data]
            for i, k in enumerate(keys):
                ws = data[k]
                fh.write(f'  {k}: `\n' + ''.join(' '.join(ws[j:j + 20]) + '\n' for j in range(0, len(ws), 20)) + '`'
                         + (',' if i < len(keys) - 1 else '') + '\n')
            fh.write('};\n')
        n = {k: len(v) for k, v in data.items()}
        bits = lambda shape: round(math.log2(10 * math.prod(n[c] for c in shape)), 1)
        report[lang] = dict(n, flagged=len(flags), bits={'memorable-3': bits(ORDER[lang][3]), 'off-3': bits(PLAIN[3]),
                                                         'memorable-4': bits(ORDER[lang][4]), 'memorable-5': bits(ORDER[lang][5])})
    json.dump(report, open(f'{OUT}/report.json', 'w'), indent=1)
    print(json.dumps(report, indent=1))


if __name__ == '__main__':
    {'gen': gen, 'rate': rate, 'safety': safety, 'adjcheck': adjcheck, 'build': build}[sys.argv[1]]()
