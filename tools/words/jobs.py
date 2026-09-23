import itertools
langs = {'en':'English','es':'Spanish (Latin American, neutral)','pt':'Brazilian Portuguese'}
cats = ['animals','food and drinks','fruits and vegetables','nature and landscape','weather and sky','home and furniture','kitchen objects','clothes and accessories','body parts','colors and shapes','family and people (roles, jobs)','city, places and buildings','transport and travel','sports and games','music, art and hobbies','school and office objects','tools and materials','everyday action verbs (infinitive)','common adjectives (qualities, feelings, sizes)','time, numbers and seasons','toys, parties and celebrations','sea, rivers and plants']
groups = ['a b c','d e f g','h i j k l','m n o p','q r s','t u v w x y z']
out=[]
for code,lang in langs.items():
    for i,c in enumerate(cats):
        out.append((f'{code}_cat{i:02d}', f"Write 150 different very common, simple, easy-to-spell {lang} words in the category: {c}. Words a child of 10 knows. Mostly 4 to 7 letters. Lowercase, only letters a-z (skip any word that has accents, tildes, ñ, ç or hyphens). No proper nouns, no brands, no offensive, sexual, violent or sad words. One word per line, no numbering, no translations, no commentary."))
    for j,g in enumerate(groups):
        out.append((f'{code}_five{j}', f"Write 200 different very common, simple {lang} words that have EXACTLY 5 letters and start with one of these letters: {g}. Any part of speech (nouns, verbs, adjectives). Words a child of 10 knows. Lowercase, only letters a-z (skip words with accents, tildes, ñ, ç). No proper nouns, no brands, no offensive, sexual, violent or sad words. One word per line, no numbering, no commentary."))
for name,p in out:
    open(f'raw/{name}.prompt','w').write(p)
print(len(out))
