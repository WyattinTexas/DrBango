// dev-check.mjs — the device report + crisp sentinel harness (v0.50.0).
// Drives a headless Chrome on :9447 over CDP against the folder served on
// :8899; either renderer (run it under --disable-gpu AND the swiftshader
// flags to walk the Canvas and the gl.drawingBuffer branches). A throwaway
// test_dev… identity writes its row with ?devreport=1 and deletes it after.
//
//   python3 -m http.server 8899 &
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --no-sandbox --mute-audio --disable-gpu \
//     --remote-debugging-port=9447 --user-data-dir=/tmp/cdp-dev \
//     --window-size=390,844 --force-device-scale-factor=3 about:blank &
//   node tools/dev-check.mjs
const BASE = 'http://localhost:8899/index.html';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const list = await (await fetch('http://127.0.0.1:9447/json/list')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') { const t = d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text; if (!/WebGL context/.test(t || '')) errs.push(t); } };
await new Promise((r) => ws.onopen = r);
const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.addScriptToEvaluateOnNewDocument', { source: 'navigator.share = undefined; navigator.clipboard = undefined;' });
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed'); return r?.result?.value; };
const UID = 'dev' + Math.floor(Math.random() * 1e6);
await send('Page.navigate', { url: BASE + '?diag=1&mpuid=' + UID + '&devreport=1' });
for (let i = 0; i < 60; i++) { await sleep(500); if (await ev('!!(window.__ssdev && window.__ssdev.last)')) break; }
let rep = JSON.parse(await ev('JSON.stringify(window.__ssdev.last)'));
ok('report built after ready (ring holds a ready beat)', rep && JSON.parse(await ev("localStorage.getItem('beta3.devlog')||'[]'")).some(r => r.tag === 'ready'), rep && rep.tag);
ok('buffer = css×dpr', rep.cw === Math.round(rep.cc[0] * rep.DPR) && rep.ch === Math.round(rep.cc[1] * rep.DPR), rep.cw + 'x' + rep.ch + ' css ' + rep.cc.join('x') + ' dpr ' + rep.DPR);
ok('crisp:true on a healthy boot', rep.crisp === true);
ok('gl drawingBuffer recorded under GL', rep.rend !== 'gl' || (rep.db && rep.db[0] === rep.cw), JSON.stringify(rep.db) + ' rend ' + rep.rend);
ok('report carries ua/vp/rend/probe/counts', rep.ua && rep.iw && rep.rend && rep.ntx > 0 && rep.ncv >= 1 && rep.ntex > 0, 'texts ' + rep.ntx + ' canvases ' + rep.ncv + ' tex ' + rep.ntex);
ok('report under ~1 KB', JSON.stringify(rep).length < 1100, JSON.stringify(rep).length + ' bytes');
ok('query recorded', /devreport=1/.test(rep.q), rep.q);
const box = await ev(`(document.getElementById('diagbox')||{}).textContent || ''`);
ok('?diag=1 box shows the report', /dev ready/.test(box) && /dev buf/.test(box) && /CRISP/.test(box), box.split('\n').filter(l => /^dev /.test(l)).length + ' dev lines');
const ring = JSON.parse(await ev(`localStorage.getItem('beta3.devlog')||'[]'`));
ok('localStorage ring holds the report', ring.length >= 1 && ring[ring.length - 1].ts === rep.ts, ring.length + ' entries');
// ---- reaches the RTDB ----
await sleep(2500);
let row = null;
for (let i = 0; i < 10 && !row; i++) { row = await (await fetch('https://testroom-75200-default-rtdb.firebaseio.com/starspell/devices/test_' + UID + '.json')).json(); if (!row) await sleep(1000); }
ok('devices/<uid> row landed in the RTDB', row && row.build === rep.build, row && row.build);
// ---- the sentinel: shrink the buffer, the settle must heal + flag ----
const before = await ev(`(()=>{ game.canvas.width = 500; return game.canvas.width })()`);
ok('forced mismatch staged (canvas.width 500)', before === 500);
// the box is a 14-line window and the settle loop re-polls: tap DIAG itself
// so the crisp line is read even after it scrolled off the box
await ev(`(() => { window.__dl = []; const k = window.SSDIAG; window.SSDIAG = (m) => { window.__dl.push(m); k(m); }; return 1 })()`);
await ev(`window.dispatchEvent(new Event('resize')); 'kicked'`);
await sleep(700);
rep = JSON.parse(await ev('JSON.stringify(window.__ssdev.last)'));
ok('settle beat ran', rep.tag === 'settle', rep.tag);
ok('sentinel recorded the mismatch as found', Array.isArray(rep.found) && rep.found[1] === 500, JSON.stringify(rep.found));
ok('sentinel healed: buffer back to css×dpr', rep.cw === Math.round(rep.cc[0] * rep.DPR) && rep.crisp === true, rep.cw + 'x' + rep.ch);
const box2 = await ev(`(window.__dl || []).join('\\n')`);
ok('diag names the miss', /crisp: found buffer 500x/.test(box2), (box2.match(/crisp:[^\n]*/g) || []).join(' | '));
// direct heal (no settle) — the beat itself heals once
await ev(`(()=>{ game.canvas.width = 400; return window.__ssDevBeat('drill') && 1 })()`);
rep = JSON.parse(await ev('JSON.stringify(window.__ssdev.last)'));
ok('beat heals a live mismatch by itself', rep.cw !== 400 && rep.crisp === true && rep.heals >= 1 && rep.found && rep.found[1] === 400, 'heals ' + rep.heals + ' found ' + JSON.stringify(rep.found));
await sleep(2500);
let row2 = null;
for (let i = 0; i < 10; i++) { row2 = await (await fetch('https://testroom-75200-default-rtdb.firebaseio.com/starspell/devices/test_' + UID + '.json')).json(); if (row2 && row2.heals >= 1) break; await sleep(1000); }
ok('RTDB row overwritten with the healed report', row2 && row2.heals >= 1 && row2.found, row2 && ('heals ' + row2.heals));
// ---- quiet on a plain boot: no heals, no diag text, no test_ write without devreport ----
const UID2 = 'dev' + Math.floor(Math.random() * 1e6);
await send('Page.navigate', { url: BASE + '?mpuid=' + UID2 });
for (let i = 0; i < 60; i++) { await sleep(500); if (await ev('!!(window.__ssdev && window.__ssdev.last)')) break; }
await sleep(3000);
rep = JSON.parse(await ev('JSON.stringify(window.__ssdev.last)'));
ok('plain boot: crisp, zero heals (sentinel is a no-op)', rep.crisp === true && rep.heals === 0);
ok('plain boot: no diag box', await ev(`!document.getElementById('diagbox')`));
const row3 = await (await fetch('https://testroom-75200-default-rtdb.firebaseio.com/starspell/devices/test_' + UID2 + '.json')).json();
ok('test_ identity writes nothing home without ?devreport=1', row3 === null);
ok('no page exceptions', errs.length === 0, errs.join(' | ').slice(0, 300));
// cleanup the drill row
await fetch('https://testroom-75200-default-rtdb.firebaseio.com/starspell/devices/test_' + UID + '.json', { method: 'DELETE' });
console.log(pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
