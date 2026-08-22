// device-rows.mjs — print every devices/<uid> row the game reported home
// (v0.50.0: the device report, see game.js ssDeviceBeat). One command reads
// Wyatt's phone: what it is, what buffer it drew, what renderer it chose and
// whether the crisp sentinel agreed. Run from anywhere:
//
//   node tools/device-rows.mjs                 # every row, newest first
//   node tools/device-rows.mjs --name=hare     # rows whose players/<uid> name matches
//   node tools/device-rows.mjs --uid=u26       # uid prefix
//   node tools/device-rows.mjs --all           # include the harnesses' test_ identities
//   node tools/device-rows.mjs --json          # raw rows
//
// Read-only, public RTDB, no secrets.
const ROOT = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell';
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const get = async (p) => (await (await fetch(ROOT + '/' + p + '.json')).json()) || {};
const [devices, players] = await Promise.all([get('devices'), get('players')]);
let rows = Object.entries(devices).map(([uid, r]) => Object.assign({ uid, name: (players[uid] && players[uid].name) || '' }, r));
if (!args.all) rows = rows.filter((r) => !/^test_/.test(r.uid));
if (args.name) rows = rows.filter((r) => r.name.toLowerCase().includes(String(args.name).toLowerCase()));
if (args.uid) rows = rows.filter((r) => r.uid.startsWith(String(args.uid)));
rows.sort((a, b) => (b.ts || 0) - (a.ts || 0));
if (args.json) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }
if (!rows.length) { console.log('no device rows' + (args.name ? ' for name ' + args.name : '') + (args.all ? '' : ' (try --all for test_ identities)')); process.exit(0); }
const ago = (t) => { const s = Math.max(0, Date.now() - t) / 1000; return s < 90 ? Math.round(s) + 's' : s < 5400 ? Math.round(s / 60) + 'm' : s < 172800 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd'; };
const xy = (a) => (Array.isArray(a) ? a.join('x') : '—');
for (const r of rows) {
  console.log('━━ ' + (r.name || '(no name)') + ' · ' + r.uid + ' · ' + (r.ts ? new Date(r.ts).toISOString().slice(0, 19).replace('T', ' ') + ' (' + ago(r.ts) + ' ago)' : '?') + ' · ' + (r.build || '?') + ' · ' + (r.tag || ''));
  console.log('   ua      ' + (r.ua || '') + (r.shell ? '\n   shell   ' + r.shell : '') + (r.sa ? '\n   standalone' : '') + (r.q ? '\n   query   ' + r.q : ''));
  console.log('   view    ' + r.iw + 'x' + r.ih + ' · visual ' + (r.vv ? r.vv[0] + 'x' + r.vv[1] + ' @' + r.vv[2] : '—') + ' · dpr ' + r.dpr + ' → chose ' + r.DPR + (r.dprOff ? '  ⚠ forced (device ' + r.dprOff + ')' : '') + ' · inset ' + xy(r.inset) + ' · mem ' + r.mem + 'GB · cores ' + r.hc);
  console.log('   canvas  buffer ' + r.cw + 'x' + r.ch + ' · css ' + xy(r.cc) + ' · style ' + xy(r.cs) + ' · game ' + r.gw + 'x' + r.gh + (r.db ? ' · gl drawingBuffer ' + xy(r.db) : '') + ' · canvases ' + r.ncv + ' · texts ' + r.ntx + ' · textures ' + r.ntex);
  console.log('   render  ' + r.rend + ' (' + r.mode + '/' + r.why + ')' + (r.probe ? ' · probe gl ' + r.probe[0] + ' cv ' + r.probe[1] + ' ms/f in ' + r.probe[2] + 'ms ' + r.probe[3] : '') + (r.gpu ? ' · ' + r.gpu : ''));
  console.log('   crisp   ' + (r.crisp ? '✓ buffer = css × dpr' : '✗ ' + (r.miss || '') + (r.dprOff ? ' dpr forced' : '')) + (r.found ? ' · found ' + r.found.join('/') : '') + (r.heals ? ' · heals ' + r.heals : ''));
}
console.log(rows.length + ' device row' + (rows.length === 1 ? '' : 's'));
