// ZOD-EXPORT — cuts the 12 MJ zodiac sign portraits into the card picker's
// art seam (task 47). Reads the frame picks from
// ~/starspell-jumpr/ref/zodiac-mj/PICKS.md (1-INDEXED — pick n = source file
// zod_<sign><n-1>.webp; aries pick Bn = aries_B<n-1>.webp, the anchor job),
// falls back to the same defaults if that file is missing, and emits
// beta3/art/zod_<id>.webp for every sign whose pick changed — a manifest
// (art/zod-manifest.json) records what each output was cut from, so changing
// one pick and rerunning regenerates exactly that file. FORCE=1 rebuilds all.
//
//   node tools/zod-export.mjs
//
// The cut itself is minimal surgery on purpose: the MJ sources are full-bleed
// 896×1344 portraits, already exactly 2:3 (verified — if a future reroll
// drifts, the tool center-crops to 2:3 before scaling). No borders, no alpha
// (the seam bakes the rounded corners at load; ssZodArtKey). Downscaled to
// 512×768 — the art region is 160×240 design units and the largest phone
// (iPhone 16 Pro Max, 440css @3, s = 1320/420) renders it at 503×754 device
// px, so 512×768 covers every device with nothing wasted. webp q78 keeps the
// whole 12-file set well under the 2.5MB budget (the repo is over its Pages
// size limit; full-res MJ sources stay OUT of the repo, in ref/zodiac-mj/).
//
// sharp lives OUTSIDE the repo (no npm install in ~/DrBango — standing
// order): ~/starspell-jumpr/tools-deps/node_modules/sharp.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOME = homedir();
const SRC = process.env.ZOD_SRC || join(HOME, 'starspell-jumpr/ref/zodiac-mj');
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../art');
const MANIFEST = join(OUT, 'zod-manifest.json');
const W = 512, H = 768, QUALITY = 78;

const SHARP_DIR = process.env.ZOD_SHARP || join(HOME, 'starspell-jumpr/tools-deps/node_modules/sharp');
let sharp;
try { sharp = createRequire(import.meta.url)(SHARP_DIR); }
catch (e) {
  console.error('sharp not found at ' + SHARP_DIR +
    '\n  npm install sharp --prefix ~/starspell-jumpr/tools-deps' +
    '\n  (never inside ~/DrBango), or point ZOD_SHARP at a sharp build.');
  process.exit(2);
}

// the standing defaults (task 47) — PICKS.md overrides, line format `sign n`
const DEFAULTS = {
  aries: 'B2', taurus: '4', gemini: '4', cancer: '4', leo: '2', virgo: '3',
  libra: '2', scorpio: '2', sagittarius: '4', capricorn: '3', aquarius: '4', pisces: '2',
};
const SIGNS = Object.keys(DEFAULTS);

function readPicks() {
  const p = join(SRC, 'PICKS.md');
  const picks = { ...DEFAULTS };
  if (!existsSync(p)) { console.log('no PICKS.md — using built-in defaults'); return picks; }
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.trim().match(/^([a-z]+)\s+(B?\d)$/i);
    if (m && SIGNS.includes(m[1].toLowerCase())) picks[m[1].toLowerCase()] = m[2].toUpperCase();
  }
  return picks;
}

// pick → source filename. Picks are 1-indexed (how Wyatt speaks); files are
// zero-indexed (how MJ frames land).
function srcFile(sign, pick) {
  const m = pick.match(/^(B?)(\d)$/);
  const n = parseInt(m[2], 10) - 1;
  if (n < 0 || n > 3) throw new Error(sign + ': pick out of range: ' + pick);
  return m[1] ? `aries_B${n}.webp` : `zod_${sign}${n}.webp`;
}

const picks = readPicks();
let manifest = {};
try { manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch (e) { }

let built = 0, total = 0;
const next = {};
for (const sign of SIGNS) {
  const pick = picks[sign];
  const src = srcFile(sign, pick);
  const srcPath = join(SRC, src);
  if (!existsSync(srcPath)) { console.error('MISSING source ' + srcPath); process.exit(2); }
  const outPath = join(OUT, `zod_${sign}.webp`);
  const entry = { pick, src, w: W, h: H, q: QUALITY, srcMtime: statSync(srcPath).mtimeMs };
  const cur = manifest[sign];
  const fresh = existsSync(outPath) && cur && JSON.stringify(cur) === JSON.stringify(entry) && !process.env.FORCE;
  if (!fresh) {
    const meta = await sharp(srcPath).metadata();
    let img = sharp(srcPath);
    // uniform center-crop to exactly 2:3 if MJ drifted (sources today: 896×1344, no-op)
    const want = meta.width / meta.height, target = 2 / 3;
    if (Math.abs(want - target) > 0.002) {
      const cw = Math.min(meta.width, Math.round(meta.height * target));
      const ch = Math.min(meta.height, Math.round(meta.width / target));
      img = img.extract({ left: (meta.width - cw) >> 1, top: (meta.height - ch) >> 1, width: cw, height: ch });
      console.log(`  ${sign}: drifted ${meta.width}×${meta.height}, cropped to ${cw}×${ch}`);
    }
    await img.resize(W, H).webp({ quality: QUALITY }).toFile(outPath);
    built++;
  }
  next[sign] = entry;
  const bytes = statSync(outPath).size;
  total += bytes;
  console.log(`  ${fresh ? '·' : '✚'} zod_${sign}.webp  ${(bytes / 1024).toFixed(1)}KB  (pick ${pick} = ${src})`);
}
writeFileSync(MANIFEST, JSON.stringify(next, null, 1) + '\n');
console.log(`${built} built, ${12 - built} unchanged · set total ${(total / 1024).toFixed(1)}KB` +
  (total > 2.5 * 1024 * 1024 ? '  ⚠ OVER the 2.5MB budget — lower QUALITY' : '  (budget 2560KB)'));
