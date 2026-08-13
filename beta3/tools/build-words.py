#!/usr/bin/env python3
"""Rebuild words.js from allscrabblewords.com.

    python3 tools/build-words.py [--cache DIR]

Fetches /words-that-start-with/{a..z} (each page lists that letter's 2-8 letter
words in per-length sections — exactly the range the game uses, since a word
line holds at most 8 tiles) and writes ../words.js.

Notes for whoever runs this next:
  * The site answers on http://www. only — https/443 times out, and the bare
    apex 301s to www. curl follows it; don't "fix" the scheme to https.
  * robots.txt has no Disallow rules. Requests are sequential with a delay.
  * The source list is already screened for slurs and explicit terms, which is
    what we want for this game, but the screen has false positives — ordinary
    words like "pig", "pawn", "spots", "tighten". Those are listed in RESTORE
    and added back. Move the line by editing RESTORE.
"""
import argparse
import os
import re
import subprocess
import sys
import time
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, os.pardir, 'words.js')
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36')

# Ordinary words the source's content filter drops. Kept out deliberately:
# slurs and explicit sexual/scatological terms — the filter's real purpose.
RESTORE = """
behead bloody bum butt climax cox crap damn erotic escort flange fondle frigid
grot hell hoar hoe hoer hoes knob lipper lippers lust lusting moan moaner
moaners moans naked nip nips nob pawn pig sadist sidle smut spots spunk suck
sucker suckers sucking tighten willies
""".split()

LINK = re.compile(r'<a[^>]+href=["\']/word-description/([a-z]+)["\'][^>]*>([A-Za-z]+)</a>')
HEAD = re.compile(r'<h3[^>]*>(\d) letter words that start with the letters ([a-z])</h3>')


def fetch(letter, cache):
    path = os.path.join(cache, letter + '.html')
    if os.path.exists(path) and os.path.getsize(path) > 20_000:
        return path
    url = 'http://www.allscrabblewords.com/words-that-start-with/' + letter
    for attempt in range(4):
        r = subprocess.run(['curl', '-s', '-L', '-m', '90', '--compressed', '-A', UA,
                            '-o', path, '-w', '%{http_code}', url],
                           capture_output=True, text=True)
        size = os.path.getsize(path) if os.path.exists(path) else 0
        if r.stdout.strip() == '200' and size > 20_000:
            return path
        time.sleep(3 * (attempt + 1))
    sys.exit('failed to fetch %s (last size %d)' % (url, size))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default=os.path.join(HERE, '.wordcache'),
                    help='directory for downloaded HTML (reused if present)')
    args = ap.parse_args()
    os.makedirs(args.cache, exist_ok=True)

    words = set()
    for ch in 'abcdefghijklmnopqrstuvwxyz':
        path = fetch(ch, args.cache)
        d = open(path, encoding='utf-8', errors='replace').read()
        lens = {int(m.group(1)) for m in HEAD.finditer(d)}
        # no 2-letter word starts with c or v, so those sections are absent
        expected = set(range(2, 9)) - ({2} if ch in 'cv' else set())
        if not expected <= lens:
            sys.exit('%s: page truncated, missing length sections %s'
                     % (ch, sorted(expected - lens)))
        found = {s for s, t in LINK.findall(d)
                 if s == t.lower() and 2 <= len(s) <= 8 and s.startswith(ch)}
        words |= found
        print('%s: %d' % (ch, len(found)), flush=True)
        time.sleep(1.5)

    prev = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
    old = set(re.search(r'"([a-z ]+)"', prev).group(1).split()) if prev else set()
    restored = {w for w in RESTORE if w in old} if old else set(RESTORE)
    missing = [w for w in RESTORE if old and w not in old]
    if missing:
        print('note: RESTORE entries absent from the previous list:', missing)

    words |= restored
    bad = [w for w in words if not re.fullmatch(r'[a-z]{2,8}', w)]
    if bad:
        sys.exit('bad tokens: %s' % bad[:10])

    out = sorted(words)
    header = ('// Scrabble word list (allscrabblewords.com, 2-8 letters) + %d restored '
              'common words — %d words\n' % (len(restored), len(out)))
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(header + 'const STARSPELL_WORDS = "%s";\n' % ' '.join(out))

    print('wrote %s: %d words' % (os.path.normpath(OUT), len(out)))
    print('by length:', sorted(Counter(len(w) for w in out).items()))
    if old:
        print('gained %d, lost %d vs previous list' % (len(words - old), len(old - words)))


if __name__ == '__main__':
    main()
