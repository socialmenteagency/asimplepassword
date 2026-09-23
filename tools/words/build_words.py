# Build site/words.js. With --preview, uses unjudged candidates (frequency only) so the UI can be tested.
import json, glob, re, sys, secrets, os
from wordfreq import zipf_frequency
c = json.load(open('candidates.json'))
FINAL = {3: 300, 4: 600, 5: 1800, 6: 600, 7: 500, 8: 400}
preview = '--preview' in sys.argv
block = set(w for line in open('blocklist.txt') if not line.startswith('#') for w in line.split()) if os.path.exists('blocklist.txt') else set()
out, report = {}, {}

def plurals(w, lang):
    if lang == 'en':
        if re.search(r'(s|x|z|ch|sh)$', w): return [w + 'es']
        if re.search(r'[^aeiou]y$', w): return [w[:-1] + 'ies']
        return [w + 's']
    if lang == 'es':
        if w[-1] in 'aeiou': return [w + 's']
        if w[-1] == 'z': return [w[:-1] + 'ces']
        if w[-1] in 'lnrdj': return [w + 'es']
        return []
    if w[-1] in 'aeiou': return [w + 's']   # pt
    if w[-1] in 'rzs': return [w + 'es']
    if w[-1] == 'm': return [w[:-1] + 'ns']
    if w.endswith('al'): return [w[:-1] + 'is']
    return []
for lang, words in c.items():
    approved = set()
    if preview:
        approved = set(words)
    else:
        # Every attempt counts: .txt pairs with .prompt, and a first attempt
        # that came back broken (.try1) pairs with its original prompt (.done1).
        for f in glob.glob(f'judge/{lang}_*.txt') + glob.glob(f'judge/{lang}_*.try1'):
            pf = f[:-4] + '.prompt' if f.endswith('.txt') else f[:-5] + '.done1'
            chunk = set(open(pf).read().split('LIST:\n', 1)[1].split())
            for line in open(f, errors='ignore'):
                w = line.strip().strip('-*•`').strip().lower()
                if w in chunk: approved.add(w)
    approved -= block
    # Plurals of approved words (gato -> gatos, bird -> birds) are just as easy to
    # remember. Keep one only if wordfreq knows it as a real, reasonably common word.
    z = {w: words[w]['z'] for w in approved if w in words}
    if not preview:
        for w in list(approved):
            for p in plurals(w, lang):
                if re.fullmatch(r'[a-z]{3,8}', p) and p not in approved and p not in block:
                    pz = zipf_frequency(p, lang)
                    if pz >= 2.5:
                        approved.add(p); z[p] = pz
    out[lang] = {}
    for L, q in FINAL.items():
        ws = sorted((w for w in approved if len(w) == L), key=lambda w: -z.get(w, 0))[:q]
        # Cosmetic shuffle (CSPRNG Fisher-Yates) so the shipped file isn't ranked;
        # the real randomness is the per-pick crypto.getRandomValues in gen.js.
        for i in range(len(ws) - 1, 0, -1):
            j = secrets.randbelow(i + 1); ws[i], ws[j] = ws[j], ws[i]
        out[lang][L] = ws
    report[lang] = {L: len(v) for L, v in out[lang].items()}
print(json.dumps(report))
with open(sys.argv[-1] if sys.argv[-1].endswith('.js') else '../../site/words.js', 'w') as fh:
    fh.write('// Word pools by language and length. Built by build_words.py (NaN generation + NaN review + wordfreq ranking).\n')
    # Plain word blocks, 20 words per line: small, readable diffs, easy to review.
    # The loop at the end turns each block into an array when the page loads.
    fh.write('window.ASP_WORDS = {\n')
    for li, (lang, pools) in enumerate(out.items()):
        fh.write(f'  {lang}: {{\n')
        for pi, (L, ws) in enumerate(pools.items()):
            fh.write(f'    {L}: `\n')
            for i in range(0, len(ws), 20):
                fh.write(' '.join(ws[i:i+20]) + '\n')
            fh.write('`' + (',' if pi < len(pools) - 1 else '') + '\n')
        fh.write('  }' + (',' if li < len(out) - 1 else '') + '\n')
    fh.write('};\n')
    fh.write('for (var l in ASP_WORDS) for (var n in ASP_WORDS[l]) ASP_WORDS[l][n] = ASP_WORDS[l][n].trim().split(/\\s+/);\n')
