# Merge NaN-generated words with wordfreq's most common words; filter; report counts.
import glob, re, json, collections
from wordfreq import zipf_frequency, top_n_list
WF = {'en':'en','es':'es','pt':'pt'}
ok = re.compile(r'^[a-z]{3,8}$')
out = {}
for lang in ['en','es','pt']:
    gen = set()
    for f in glob.glob(f'raw/{lang}_*.txt'):
        for line in open(f, errors='ignore'):
            w = line.strip().strip('-*•.,;:0123456789) ').lower()
            if ok.match(w): gen.add(w)
    top = {w for w in top_n_list(WF[lang], 40000) if ok.match(w)}
    cands = {}
    for w in gen | top:
        z = zipf_frequency(w, WF[lang])
        if z >= 3.0: cands[w] = {'z': round(z,2), 'nan': w in gen}
    out[lang] = cands
    by = collections.Counter(len(w) for w in cands)
    print(lang, 'nan-gen', len(gen), 'cands', len(cands), 'from-nan', sum(v['nan'] for v in cands.values()), dict(sorted(by.items())))
json.dump(out, open('candidates.json','w'))
