# Build site/memo-{en,es,pt}.js from the tagging answers in memo/*.txt (see memo_prep.py).
# Nouns and adjectives are site words as they are; verbs are stored in their
# "she does" form (paints, pinta), kept only when that form is plain a-z,
# 3-8 letters, known to wordfreq and not blocklisted.
# Adjectives get a second pass: `build_memo.py --adj-prompts` writes memo/adj-*.prompt
# (run them with run2.sh); once answered, only the vivid adjectives they keep are used.
import glob, json, re, sys
from wordfreq import zipf_frequency

ORDER = {
    'en': {2: 'NV', 3: 'NVN', 4: 'ANVN', 5: 'ANVAN'},    # happy otter paints moon
    'es': {2: 'NV', 3: 'NVN', 4: 'NAVN', 5: 'NAVNA'},    # gato feliz pinta luna
    'pt': {2: 'NV', 3: 'NVN', 4: 'NAVN', 5: 'NAVNA'},
}
block = set(w for line in open('blocklist.txt') if not line.startswith('#') for w in line.split())
# Memorable pools only (fine words elsewhere): read by hand on 23-sep-2026.
# Dark or loaded verbs, gendered or sensitive adjectives, nationalities, slang, odd forms and
# a Spanish form the model put in the Portuguese list.
MEMO_DROP = {
    'en': set('pregnant manly girly pious chokes scalps whacks bleeds strips robs mugs heists bribes cheats bullies '
              'arrests cons crooks exiles harms hurts sues trusses'.split()),
    'es': set('cutre guay pare yerra zafa idea basa muela lame mete chileno chino cubano europeo italiano romano ruso turco'.split()),
    'pt': set('acorde cuenta bases arca pira geme sola mola rala roga estufa gere come carioca europeu italiana italiano latino mexicano russo turco'.split()),
}

# The model sometimes tags plurals (grandes, felices, birds); next to a singular
# noun they read wrong, so drop any word whose singular is also a site word.
def is_plural(w, words):
    if not w.endswith('s'): return False
    return any(s in words for s in (w[:-1], w[:-2], w[:-3] + 'y', w[:-3] + 'z', w[:-2] + 'l', w[:-2] + 'm'))

ADJ_PROMPT = ("From this list of {name} adjectives, keep only the ones that paint a picture or a feeling next to a thing, "
              "like 'fuzzy', 'loud', 'sleepy', 'green', 'brave', 'sticky'. Drop technical, administrative or abstract ones "
              "like 'annual', 'global', 'mere', 'regular', 'legal', 'nuclear', 'central'. "
              "Output only the kept words, one per line, nothing else.\n\nLIST:\n")
NAMES = {'en': 'English', 'es': 'Spanish', 'pt': 'Brazilian Portuguese'}

report = {}
for lang, order in ORDER.items():
    asked = {}
    for f in glob.glob(f'memo/{lang}_*.prompt'):
        for w in open(f).read().split('WORDS:\n', 1)[1].split():
            asked[w] = f
    pools = {'N': set(), 'V': set(), 'A': set()}
    seen = set()
    for f in glob.glob(f'memo/{lang}_*.txt'):
        for line in open(f, errors='ignore'):
            # Tags sometimes come as "N,V" or "N A", and the last "|" can be missing.
            m = re.fullmatch(r'([a-z]+)\|([NVA, -]*)\|?(\S*)', line.strip())
            if not m or m[1] not in asked: continue
            w, tags, form = m[1], m[2], m[3].lower()
            seen.add(w)
            if w in block or w in MEMO_DROP[lang]: continue
            if 'N' in tags and not is_plural(w, asked): pools['N'].add(w)
            if 'A' in tags and not is_plural(w, asked): pools['A'].add(w)
            if 'V' in tags and re.fullmatch(r'[a-z]{3,8}', form) and form not in block and form not in MEMO_DROP[lang] and zipf_frequency(form, lang) >= 2:
                pools['V'].add(form)
    if '--adj-prompts' in sys.argv:
        ws = sorted(pools['A'])
        for i in range(0, len(ws), 100):
            open(f'memo/adj-{lang}_{i // 100:03d}.prompt', 'w').write(ADJ_PROMPT.format(name=NAMES[lang]) + '\n'.join(ws[i:i + 100]) + '\n')
        continue
    answers = glob.glob(f'memo/adj-{lang}_*.txt')
    if answers:
        vivid = set(line.strip().lower() for f in answers for line in open(f, errors='ignore'))
        pools['A'] &= vivid
    missing = sorted(set(asked) - seen)
    report[lang] = {c: len(p) for c, p in pools.items()}
    report[lang]['untagged'] = len(missing)
    with open(f'../../site/memo-{lang}.js', 'w') as fh:
        fh.write(f'// {lang} grammar pools for "Make it memorable". Built by tools/words/build_memo.py (NaN tagging of the site words).\n')
        fh.write(f'(window.ASP_MEMO = window.ASP_MEMO || {{}}).{lang} = {{\n  order: {json.dumps({str(k): v for k, v in order.items()})},\n')
        for ci, c in enumerate('NVA'):
            ws = sorted(pools[c])
            fh.write(f'  {c}: `\n' + ''.join(' '.join(ws[i:i + 20]) + '\n' for i in range(0, len(ws), 20)) + '`' + (',' if ci < 2 else '') + '\n')
        fh.write('};\n')
print(json.dumps(report))
