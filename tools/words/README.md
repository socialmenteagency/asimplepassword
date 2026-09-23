# Word list pipeline

Builds `site/words-en.js`, `words-es.js` and `words-pt.js`: per language (en, es, pt-BR), pools of words by length 3–8,
with 5-letter words as the default pool.

1. **Generate** (`jobs.py` → `run1.sh`): NaN `deepseek-v4-flash` via `opencode run` writes
   simple words by topic (22 topics) and 5-letter words by starting letter, per language.
   Only a–z: words with accents, ñ or ç are skipped on purpose (they break on many sites and keyboards).
2. **Candidates** (`candidates.py`): the generated words plus the most common a–z words in each
   language from [wordfreq](https://github.com/rspeer/wordfreq), keeping words with a Zipf frequency ≥ 3.
3. **Review** (`judge_prep.py` → `run2.sh`): a NaN model reviews each candidate in batches of 250.
   It keeps only real, correctly spelled, well-known nouns/adjectives/infinitives, and drops
   plurals, conjugations, function words, names, brands, and anything offensive or sad.
   (First batches ran on `qwen3.6`; it timed out often, so the rest ran on `deepseek-v4-flash`.)
4. **Build** (`build_words.py`): approved words minus `blocklist.txt`, ranked by frequency,
   capped at 1,800 five-letter words (the Spanish and Portuguese lists end up near 1,140 because accented words are excluded) and 300–600 for the other lengths, then shuffled. Plurals of approved words are added when wordfreq knows them (gato → gatos).

The shuffle is cosmetic. Security comes from `site/gen.js`, which draws every word
uniformly with `crypto.getRandomValues`, so list order doesn't matter.

```
python3 -m venv venv && ./venv/bin/pip install wordfreq
python3 jobs.py && ls raw/*.prompt | xargs -P 6 -n 1 ./run1.sh
./venv/bin/python candidates.py && ./venv/bin/python judge_prep.py
ls judge/*.prompt | xargs -P 8 -n 1 ./run2.sh
./venv/bin/python build_words.py ../../site/words.js   # writes words-en.js, words-es.js, words-pt.js
```
