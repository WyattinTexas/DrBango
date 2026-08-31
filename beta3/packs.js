'use strict';
/* ============================================================
   STARSPELL language packs — the GAME in your language.
   strings.js localizes the UI; this file localizes the PLAY:
   a letter bag with that language's real frequencies and point
   values (official Scrabble distributions, minus the blanks;
   rebalanced 8/31: each pack's four most-common vowels -1, every
   2-count consonant +1 — consonant variety, not vowel supply, is
   what limits word-making on a 16-tile board with the 5-vowel floor),
   its special tiles (Ñ, Ç, Ä/Ö/Ü, and the CH/LL/RR digraphs of
   Spanish), and a dictionary of that language's words.

   A pack's dictionary lives in words-<lang>.js (built by
   tools/make-word-packs.py) and is loaded only when needed:
   synchronously at boot for the player's own language, or
   asynchronously when joining a versus room sealed in another
   tongue. English (words.js) is always resident — it is the
   fallback for every language that has no viable letter-tile
   pack (CJK, Devanagari, Arabic script).

   Words are stored normalized the way Scrabble normalizes:
   accents stripped (á→a, é→e) EXCEPT letters that are real
   tiles (ñ, ç, ä/ö/ü), and ß→ss. Multi-letter tiles (QU, CH,
   LL, RR) are ordinary letter sequences inside a word, so the
   dictionary, the trie and currentWord() need no special
   casing — exactly how the English Qu tile always worked.
   ============================================================ */

const SS_PACKS = {
  en: {
    lang: 'en', vowels: 'aeiou', digraph: { q: 'qu' },
    bag: { e: 11, a: 8, i: 8, o: 7, n: 6, r: 6, t: 6, l: 4, s: 4, u: 4, d: 4, g: 3, b: 3, c: 3, m: 3, p: 3, f: 3, h: 3, v: 3, w: 3, y: 3, k: 1, j: 1, x: 1, q: 1, z: 1 },
    vals: { a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 9, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10, qu: 10 },
  },
  es: {
    lang: 'es', vowels: 'aeiou', digraph: { q: 'qu' },
    bag: { a: 11, e: 11, o: 8, i: 5, s: 6, n: 5, r: 5, u: 5, d: 5, l: 4, t: 4, c: 4, g: 3, b: 3, m: 3, p: 3, h: 3, f: 1, v: 1, y: 1, q: 1, j: 1, 'ñ': 1, x: 1, z: 1, ch: 1, ll: 1, rr: 1 },
    vals: { a: 1, e: 1, o: 1, i: 1, s: 1, n: 1, r: 1, u: 1, l: 1, t: 1, d: 2, g: 2, b: 3, c: 3, m: 3, p: 3, h: 4, f: 4, v: 4, y: 4, q: 5, j: 8, 'ñ': 8, x: 8, z: 10, ch: 5, ll: 8, rr: 8, qu: 6 },
  },
  fr: {
    lang: 'fr', vowels: 'aeiou', digraph: { q: 'qu' },
    bag: { e: 14, a: 8, i: 7, n: 6, o: 5, r: 6, s: 6, t: 6, u: 6, l: 5, d: 3, m: 3, g: 3, b: 3, c: 3, p: 3, f: 3, h: 3, v: 3, j: 1, q: 1, k: 1, w: 1, x: 1, y: 1, z: 1 },
    vals: { e: 1, a: 1, i: 1, n: 1, o: 1, r: 1, s: 1, t: 1, u: 1, l: 1, d: 2, m: 2, g: 2, b: 3, c: 3, p: 3, f: 4, h: 4, v: 4, j: 8, q: 8, k: 10, w: 10, x: 10, y: 10, z: 10, qu: 9 },
  },
  pt: {
    lang: 'pt', vowels: 'aeiou', digraph: { q: 'qu' },
    bag: { a: 13, e: 10, i: 9, o: 9, s: 8, u: 7, m: 6, r: 6, t: 5, d: 5, l: 5, c: 4, p: 4, n: 4, b: 3, 'ç': 3, f: 3, g: 3, h: 3, v: 3, j: 3, q: 1, x: 1, z: 1 },
    vals: { a: 1, e: 1, i: 1, o: 1, s: 1, u: 1, m: 1, r: 1, t: 1, d: 2, l: 2, c: 2, p: 2, n: 3, b: 3, 'ç': 3, f: 4, g: 4, h: 4, v: 4, j: 5, q: 6, x: 8, z: 8, qu: 7 },
  },
  de: {
    lang: 'de', vowels: 'aeiouäöü', digraph: { q: 'qu' },
    bag: { e: 14, n: 9, s: 7, i: 5, r: 6, t: 6, u: 5, a: 4, d: 4, h: 4, m: 4, g: 3, l: 3, o: 3, b: 3, c: 3, f: 3, k: 3, w: 1, z: 1, p: 1, 'ä': 1, j: 1, 'ü': 1, v: 1, 'ö': 1, x: 1, q: 1, y: 1 },
    vals: { e: 1, n: 1, s: 1, i: 1, r: 1, t: 1, u: 1, a: 1, d: 1, h: 2, g: 2, l: 2, o: 2, m: 3, b: 3, w: 3, z: 3, c: 4, f: 4, k: 4, p: 4, 'ä': 6, j: 6, 'ü': 6, v: 6, 'ö': 8, x: 8, q: 10, y: 10, qu: 11 },
  },
};

// The gameplay language: the UI language when it has a pack, else English.
// ja/ko/zh/hi/ar keep their localized UI but play the English game — kana,
// Hangul blocks, Devanagari conjuncts, CJK and cursive Arabic don't decompose
// onto independent letter tiles the way alphabetic scripts do.
function ssGameLang() { return SS_PACKS[SS_LANG] ? SS_LANG : 'en'; }

// Deterministic per-pack salt for the daily seed: same-language hunters share
// one board, different languages hunt different skies. 0 for English so the
// long-standing en daily boards keep their seeds.
function ssPackSeed(lang) {
  const gl = lang || ssGameLang();
  if (gl === 'en') return 0;
  let h = 0;
  for (const c of gl) h = (h * 131 + c.charCodeAt(0)) | 0;
  return h & 0x7ffffff;
}

// the weighted draw array a pack's bag expands into (built once per pack)
function ssBagArr(pack) {
  if (!pack._bag) {
    pack._bag = [];
    for (const [ch, n] of Object.entries(pack.bag)) for (let i = 0; i < n; i++) pack._bag.push(ch);
  }
  return pack._bag;
}

/* The dictionary shelf. words.js (English) is always loaded before this file;
   words-<lang>.js files call SS_DICT.feed() when they arrive. */
const SS_DICT = {
  v: '0',
  raw: { en: (typeof STARSPELL_WORDS === 'string') ? STARSPELL_WORDS : '' },
  sets: {}, pending: {},
  feed(lang, words) { this.raw[lang] = words; },
  ready(lang) { return !!this.raw[lang]; },
  set(lang) {
    if (!this.sets[lang]) this.sets[lang] = new Set((this.raw[lang] || this.raw.en).split(' '));
    return this.sets[lang];
  },
  // boot-time, called inline from index.html while the document is still
  // parsing: document.write keeps the load synchronous, so game.js parses
  // with the player's own dictionary guaranteed resident — no async seams
  // anywhere in the solo game.
  boot(v) {
    this.v = v;
    const gl = ssGameLang();
    if (gl !== 'en' && !this.raw[gl]) {
      document.write('<script src="words-' + gl + '.js?v=' + encodeURIComponent(v) + '"><' + '/script>');
    }
  },
  // async, for versus rooms sealed in another tongue
  load(lang, cb) {
    if (!SS_PACKS[lang] || this.ready(lang)) { if (cb) cb(this.ready(lang) || lang === 'en'); return; }
    (this.pending[lang] = this.pending[lang] || []).push(cb);
    if (this.pending[lang].length > 1) return;
    const s = document.createElement('script');
    s.src = 'words-' + lang + '.js?v=' + encodeURIComponent(this.v);
    const done = (ok) => {
      const q = this.pending[lang] || [];
      delete this.pending[lang];
      for (const c of q) if (c) c(ok && this.ready(lang));
    };
    s.onload = () => done(true);
    s.onerror = () => done(false);
    document.head.appendChild(s);
  },
};
