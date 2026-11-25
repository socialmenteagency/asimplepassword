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

## "Make it memorable" pools

Builds `site/memo-en.js`, `memo-es.js` and `memo-pt.js` with `picture.py` (3-nov-2026): words you can
picture, so a password reads like a tiny cartoon. Slots: N noun, V verb with an object (kicks, patea),
S verb on its own (dances, baila), both in their "she does" form, and A adjective. In Spanish and
Portuguese an adjective is stored as `masculine|feminine` (same length) and agrees with its noun;
`F` lists the feminine nouns. The page fills the slots with uniform `crypto.getRandomValues` draws:

| | 2 words | 3 words | 4 words | 5 words |
|---|---|---|---|---|
| EN, memorable | NS | ANS `brave-APPLE-dances` | ANVN | ANVAN |
| ES/PT, memorable | NS | NAS `manzana-VALIENTE-baila` | NAVN | NAVNA |
| memorable off | random | NVN `panda-KICKS-pizza` (`plain`) | random | random |

1. **Generate** (`gen`): NaN `deepseek-v4-flash` lists concrete nouns (98 topics), visible actions
   (32 topics, each marked "reads well alone" / "with an object") and vivid adjectives (24 topics), a–z only.
2. **Rate** (`rate`): every candidate, plus the pools that were live before, gets a 1–5 picture score and a
   spelling check (accent-stripped forms like `camion`, plurals and verb forms that read as nouns are "bad").
   Kept: nouns scored 4–5 and verbs and adjectives 3–5 (stricter verbs and adjectives left pools too small to be
   safe), "ok", 3–8 letters, known to wordfreq (nouns Zipf ≥ 2, verbs and adjectives ≥ 1.5), and in Spanish and
   Portuguese not an accent-stripped spelling: if the word with one accent mark is clearly more common in wordfreq
   (camion → camión, chapeu → chapéu), it is dropped.
3. **Safety** (`safety`): `deepseek-v4-flash` and `glm5.3-flash` each list words that could offend or upset
   (slang in any country, body, violence, illness, religion, labels, insults). A word either model lists is dropped;
   `blocklist.txt` and `MEMO_DROP` still apply. Nobody reads the full lists (Rafael, 3-nov-2026): an odd pairing
   is fixed by regenerating on the page. The dropped words are in `picture/flagged-*.txt`.
4. **Adjectives, ES/PT** (`adjcheck`, 24-nov-2026): NaN answers whether each masculine/feminine pair is a real
   adjective that follows a noun directly. The first build had nouns (queso, sopa, tofu) and made-up feminine forms
   (higo|higa) that read as broken Spanish (gato-TOFU-baila); 84 ES and 5 PT were dropped. English is not checked:
   a noun before a noun is natural there (stone apple).
5. **Build** (`build`): writes the memo files and `picture/report.json` (pool sizes and bits per shape).

Answers are cached in `picture/` (gitignored), so re-running a stage makes no new calls.

```
python3 -m venv venv && ./venv/bin/pip install wordfreq httpx   # nanclient lives in ~/.nan-jobs
for s in gen rate safety adjcheck build; do ./venv/bin/python picture.py $s; done
```
