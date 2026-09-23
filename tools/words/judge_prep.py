# Pick the candidates to judge per language/length and write judge prompts in chunks of 250.
import json, os, glob
c = json.load(open('candidates.json'))
QUOTA = {3: 700, 4: 1000, 5: 3200, 6: 1000, 7: 900, 8: 700}
NAMES = {'en':'English','es':'Spanish','pt':'Brazilian Portuguese'}
os.makedirs('judge', exist_ok=True)
for f in glob.glob('judge/*.prompt'): os.remove(f)
for lang, words in c.items():
    for L, q in QUOTA.items():
        ws = [w for w in words if len(w) == L]
        # NaN-generated words first (they were asked to be simple), then by frequency.
        ws.sort(key=lambda w: (not words[w]['nan'], -words[w]['z']))
        ws = ws[:q]
        for i in range(0, len(ws), 250):
            chunk = ws[i:i+250]
            p = (f"You are building a word list for a password generator in {NAMES[lang]}. Passwords look like found-PLANT-dance-3, so every word must be instantly recognizable and easy to remember and spell.\n\n"
                 f"From the list below, KEEP a word only if ALL of these are true:\n"
                 f"- it is a real, correctly spelled {NAMES[lang]} word, spelled exactly like this (no missing accents: e.g. Spanish 'cafe' or Portuguese 'voce' are misspelled and must be dropped)\n"
                 f"- a 10-year-old native speaker knows it\n"
                 f"- it is a noun (singular), adjective (base form), or verb (infinitive{' or simple base form' if lang=='en' else ''}); drop plurals, conjugated verbs, articles, pronouns, prepositions, conjunctions and adverbs like 'there' or 'which'\n"
                 f"- it is not a proper noun, name, brand, abbreviation, or a word from another language\n"
                 f"- it is not offensive, sexual, violent, about death, illness, drugs, religion or politics\n\n"
                 f"Output ONLY the kept words, one per line, exactly as written, nothing else.\n\nLIST:\n" + "\n".join(chunk))
            open(f'judge/{lang}_{L}_{i//250:02d}.prompt','w').write(p)
print(len(glob.glob('judge/*.prompt')), 'prompts')
