# Write tagging prompts for "Make it memorable": every word on the site, in batches
# of 120, asking a NaN model which ones are nouns, verbs (with their "she does"
# form) or adjectives. Run the prompts with run2.sh, then build_memo.py.
import os, re

HEAD = {
    'en': ("English", "- V: a verb in its base form (like 'paint'). FORM = the present tense, third person singular ('paints'). Only verbs that can take a direct object ('paints the moon', 'eats a cloud').\n"
                      "- A: an adjective (like 'happy', 'green').\n"),
    'es': ("Spanish (Latin American, neutral)", "- V: a verb in its infinitive (like 'pintar'). FORM = present tense, third person singular ('pinta'), spelled exactly, with accents if it has them. Only verbs that can take a direct object ('paints the moon', 'eats a cloud').\n"
                      "- A: an adjective that has the SAME form for masculine and feminine (like 'verde', 'feliz', 'grande', 'azul'). Not 'rojo' (roja), not 'bonito' (bonita).\n"),
    'pt': ("Brazilian Portuguese", "- V: a verb in its infinitive (like 'pintar'). FORM = present tense, third person singular ('pinta'), spelled exactly, with accents if it has them. Only verbs that can take a direct object ('paints the moon', 'eats a cloud').\n"
                      "- A: an adjective that has the SAME form for masculine and feminine (like 'verde', 'feliz', 'grande', 'azul'). Not 'bonito' (bonita), not 'novo' (nova).\n"),
}

def site_words(lang):
    src = open(f'../../site/words-{lang}.js').read()
    return sorted(set(w for block in re.findall(r'`([^`]*)`', src) for w in block.split()))

os.makedirs('memo', exist_ok=True)
for lang, (name, rules) in HEAD.items():
    head = (f"You are tagging {name} words for a password generator that builds tiny, funny sentences like 'otter paints moon'.\n"
            "For EACH word below output exactly one line: word|TAGS|FORM\n"
            "TAGS is any combination of N, V, A, or - if none apply:\n"
            "- N: a SINGULAR noun for something you can picture: an object, animal, person, place, food or plant. Not abstract ideas, not plurals.\n"
            + rules +
            "FORM is only filled when TAGS contains V; otherwise leave it empty (word|N|).\n"
            "Output only the lines, in the same order, nothing else.\n\nWORDS:\n")
    words = site_words(lang)
    for i in range(0, len(words), 120):
        open(f'memo/{lang}_{i // 120:03d}.prompt', 'w').write(head + '\n'.join(words[i:i + 120]) + '\n')
    print(lang, len(words))
