// Minimal CDP driver: load a page, run JS, synthesize a real click, report.
const URL_ = process.argv[2];
const CLICK = process.argv[3] === 'click';
async function main() {
  const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  const send = (method, params) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({id: i, method, params})); });
  const logs = [];
  await new Promise(r => ws.onopen = r);
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
    if (d.method === 'Runtime.consoleAPICalled') logs.push('console: ' + d.params.args.map(a => a.value).join(' '));
    if (d.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Network.enable'); await send('Network.setCacheDisabled', {cacheDisabled: true});
  await send('Page.navigate', {url: URL_});
  await new Promise(r => setTimeout(r, 11000));
  const ev = async (expr) => (await send('Runtime.evaluate', {expression: expr, returnByValue: true, awaitPromise: false})).result?.value;
  logs.slice(-20).forEach(l=>console.log('  early: '+l));
  console.log('--- state ---');
  console.log(await ev(`(()=>{
    const g = window.game; if (!g) return 'NO GAME OBJECT';
    const c = g.canvas, r = c.getBoundingClientRect(), sm = g.scale;
    const home = g.scene.getScene('home');
    const btns = home ? home.children.list.filter(o=>o.input).length : -1;
    return JSON.stringify({
      renderer: g.renderer.type===Phaser.WEBGL?'webgl':'canvas',
      gameSize: sm.gameSize.width+'x'+sm.gameSize.height,
      displaySize: sm.displaySize.width+'x'+sm.displaySize.height,
      displayScale: sm.displayScale.x.toFixed(3)+','+sm.displayScale.y.toFixed(3),
      canvasAttr: c.width+'x'+c.height,
      canvasCSS: c.style.width+' '+c.style.height,
      rect: Math.round(r.width)+'x'+Math.round(r.height)+' @'+Math.round(r.left)+','+Math.round(r.top),
      homeActive: !!(home&&home.scene.isActive()),
      interactiveObjs: btns,
      inputEnabled: g.input.enabled, isOver: g.input.isOver,
    }, null, 1);
  })()`));
  if (CLICK && !String(await ev('!!window.game')).includes('false')) {
    // find the CAMPAIGN button's on-screen centre and click it
    const pos = await ev(`(()=>{
      const h = window.game.scene.getScene('home');
      const b = h.children.list.filter(o=>o.input && o.texture && /btn/.test(o.texture.key))[0];
      if (!b) return 'no button';
      const c = window.game.canvas, r = c.getBoundingClientRect();
      const sx = r.width / window.game.scale.gameSize.width, sy = r.height / window.game.scale.gameSize.height;
      return JSON.stringify({x: r.left + b.x*sx, y: r.top + b.y*sy, gx: b.x, gy: b.y, sx, sy, key: b.texture.key});
    })()`);
    console.log('--- click target ---'); console.log(pos);
    const p = JSON.parse(pos);
    for (const type of ['mousePressed','mouseReleased']) {
      await send('Input.dispatchMouseEvent', {type, x: p.x, y: p.y, button:'left', clickCount:1, buttons: type==='mousePressed'?1:0});
      await new Promise(r=>setTimeout(r,60));
    }
    await new Promise(r => setTimeout(r, 2500));
    console.log('--- after click ---');
    console.log(await ev(`(()=>{const g=window.game;const a=['home','battle','profile','board','vsmenu','vsbattle'].filter(k=>{const s=g.scene.getScene(k);return s&&s.scene.isActive();});return 'active scenes: '+a.join(',')+' | ascending: '+!!(g.scene.getScene('home')||{}).ascending;})()`));
  }
  console.log('--- page logs ---'); logs.slice(-15).forEach(l=>console.log('  '+l));
  ws.close();
}
main().catch(e => { console.error('driver error:', e.message); process.exit(1); });
