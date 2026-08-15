#!/usr/bin/env python3
"""Builds beta3/words-{es,fr,pt,de}.js — the per-language gameplay dictionaries.

Dev-only; nothing here runs in the browser. Downloads open word lists (cached
in ~/starspell-art-sources/wordlist-sources so the big raw files stay OUT of
the repo), normalizes them Scrabble-style, and emits SS_DICT.feed() files.

Sources (all free/open; raw files are 3-8 MB each, output is ~0.6-1.2 MB):
  es  words/an-array-of-spanish-words      MIT         636k words, accents
                                                        pre-stripped, ñ kept
  fr  words/an-array-of-french-words       MIT         336k accented words
  pt  pythonprobr/palavras                 MPL-2.0     320k accented words
  de  lleic/de-book-frequency (500k list)  Apache-2.0  book-corpus frequency
                                                        list, umlauts + ß real

Normalization = Scrabble convention per language:
  every language: lowercase, keep 2..8-letter words, letters must exist as
    tiles (multi-letter tiles CH/LL/RR/QU are ordinary letter sequences in
    the stored word, so they need no special casing here)
  es: accents already stripped by the source, ñ is a real tile and stays
  fr: strip all diacritics (French Scrabble has no accented tiles), œ→oe æ→ae,
      hyphenated/apostrophe entries dropped
  pt: strip diacritics but ç is a real tile and stays
  de: ß→ss (German Scrabble has no ß tile), ä/ö/ü are real tiles and stay,
      stray foreign diacritics folded (é→e); corpus count < 100 dropped
      (cuts OCR junk and one-off names from the book corpus)

The German book corpus carries English fragments (quoted dialogue, titles), so
"night" and "house" clear the raw count cutoff. Those are culled by relative
frequency: a word that also sits in the English Scrabble dictionary is dropped
when it is proportionally MORE frequent in English subtitles (hermitdave/
FrequencyWords en_full, CC-BY-SA-4.0 — used only as a build-time sieve, no
row of it ships) than in the German books. True homographs survive on their
German weight: war/was/hat/hand/winter/hut are big in German, tiny-by-share in
English; the/night/house/love are the reverse.

Run:  python3 tools/make-word-packs.py        (from beta3/)
"""
import json, os, re, subprocess, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
BETA3 = os.path.dirname(HERE)
CACHE = os.path.expanduser('~/starspell-art-sources/wordlist-sources')
os.makedirs(CACHE, exist_ok=True)

RAW = 'https://raw.githubusercontent.com/'
SOURCES = {
    'es': (RAW + 'words/an-array-of-spanish-words/master/index.json', 'es.json'),
    'fr': (RAW + 'words/an-array-of-french-words/master/index.json', 'fr.json'),
    'pt': (RAW + 'pythonprobr/palavras/master/palavras.txt', 'pt.txt'),
    'de': (RAW + 'lleic/de-book-frequency/master/WordFrequency/wordfrequency_500k.txt', 'de.txt'),
}
LICENSE = {
    'es': 'an-array-of-spanish-words (github.com/words) · MIT',
    'fr': 'an-array-of-french-words (github.com/words) · MIT',
    'pt': 'palavras (github.com/pythonprobr) · MPL-2.0',
    'de': 'de-book-frequency (github.com/lleic) · Apache-2.0',
}
DE_MIN_COUNT = 100

# words that MUST survive the build — the special-letter tiles have to earn
# their place, and a failure here means the normalization broke
SANITY = {
    'es': ['casa', 'perro', 'niño', 'año', 'chico', 'queso', 'sol'],
    'fr': ['maison', 'ete', 'chien', 'eau', 'roi', 'coeur'],
    'pt': ['casa', 'açao', 'coraçao', 'cão'.replace('ã', 'a'), 'ceu', 'maça'],
    'de': ['haus', 'über', 'schön', 'grün', 'dass', 'weiss', 'tür'],
}


def fetch(lang):
    url, name = SOURCES[lang]
    path = os.path.join(CACHE, name)
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        print('fetching', url)
        subprocess.run(['curl', '-s', '--max-time', '180', '-o', path, url], check=True)
    return path


def strip_marks(w, keep=''):
    # fold diacritics to base letters, except the letters a pack keeps as tiles
    out = []
    for ch in w:
        if ch in keep:
            out.append(ch)
            continue
        d = unicodedata.normalize('NFD', ch)
        out.append(''.join(c for c in d if unicodedata.category(c) != 'Mn'))
    return ''.join(out)


def build(lang):
    path = fetch(lang)
    words = set()
    if lang == 'es':
        raw = json.load(open(path))
        pat = re.compile(r'^[a-zñ]{2,8}$')
        for w in raw:
            w = strip_marks(w.lower(), keep='ñ')
            if pat.match(w):
                words.add(w)
    elif lang == 'fr':
        raw = json.load(open(path))
        pat = re.compile(r'^[a-z]{2,8}$')
        for w in raw:
            if '-' in w or "'" in w:
                continue
            w = w.lower().replace('œ', 'oe').replace('æ', 'ae')
            w = strip_marks(w)
            if pat.match(w):
                words.add(w)
    elif lang == 'pt':
        pat = re.compile(r'^[a-zç]{2,8}$')
        for line in open(path, encoding='utf-8'):
            w = line.strip().lower()
            if not w or '-' in w:
                continue
            w = strip_marks(w, keep='ç')
            if pat.match(w):
                words.add(w)
    elif lang == 'de':
        en_dict = set(re.search(r'"([^"]+)"', open(os.path.join(BETA3, 'words.js'), encoding='utf-8').read()).group(1).split(' '))
        en_freq, en_total = {}, 0
        ef = os.path.join(CACHE, 'en_full.txt')
        if not os.path.exists(ef) or os.path.getsize(ef) < 1000:
            subprocess.run(['curl', '-s', '--max-time', '180', '-o', ef,
                            RAW + 'hermitdave/FrequencyWords/master/content/2018/en/en_full.txt'], check=True)
        for line in open(ef, encoding='utf-8'):
            p = line.split()
            if len(p) == 2 and p[1].isdigit():
                en_freq[p[0]] = int(p[1])
                en_total += int(p[1])
        rows, de_total = [], 0
        for line in open(path, encoding='utf-8'):
            p = line.rsplit(' ', 1)
            if len(p) != 2:
                continue
            rows.append((p[0], int(p[1])))
            de_total += int(p[1])
        pat = re.compile(r'^[a-zäöü]{2,8}$')
        for w0, c in rows:
            if c < DE_MIN_COUNT:
                continue
            w = strip_marks(w0.lower().replace('ß', 'ss'), keep='äöü')
            if not pat.match(w):
                continue
            # English-intrusion sieve (umlauts can't be English, skip the test).
            # Measured split: intruders (the/night/house/love) sit at share
            # ratio ≥ 52, true homographs (all/was/fell/man/winter) at ≤ 18 —
            # 25 cuts cleanly between them.
            if not re.search(r'[äöü]', w) and w in en_dict and w in en_freq:
                if en_freq[w] / en_total > 25 * (c / de_total):
                    continue
            words.add(w)
    missing = [w for w in SANITY[lang] if w not in words]
    if missing:
        sys.exit(f'{lang}: sanity words missing after build: {missing}')
    body = ' '.join(sorted(words))
    out = os.path.join(BETA3, f'words-{lang}.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(f"// {lang} gameplay dictionary — {len(words)} words (2-8 letters), "
                f"Scrabble-style normalized.\n"
                f"// Source: {LICENSE[lang]} · rebuilt by tools/make-word-packs.py\n")
        f.write(f"SS_DICT.feed('{lang}', \"{body}\");\n")
    print(f'{lang}: {len(words)} words → {out} ({os.path.getsize(out) // 1024} KB)')


for lang in ('es', 'fr', 'pt', 'de'):
    build(lang)
