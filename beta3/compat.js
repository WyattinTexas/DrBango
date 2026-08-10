'use strict';
// compat.js — mobile-Safari compatibility + visible error reporting.
// 1) canvas roundRect ships only in Safari 16+ / Chrome 99+; both games draw
//    every texture with it, so older iPhones black-screened at boot.
// ?noroundrect=1 force-disables the native version so the polyfill path can
// be tested on a modern desktop browser.
if (/[?&]noroundrect=1/.test(location.search) && typeof CanvasRenderingContext2D !== 'undefined') {
  CanvasRenderingContext2D.prototype.roundRect = null;
}
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number' || r == null) { r = r || 0; r = [r, r, r, r]; }
    else if (r.length === 1) r = [r[0], r[0], r[0], r[0]];
    else if (r.length === 2) r = [r[0], r[1], r[0], r[1]];
    const m = Math.min(w, h) / 2;
    const [tl, tr, br, bl] = r.map((v) => Math.min(v, m));
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y); this.arcTo(x + w, y, x + w, y + tr, tr);
    this.lineTo(x + w, y + h - br); this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h); this.arcTo(x, y + h, x, y + h - bl, bl);
    this.lineTo(x, y + tl); this.arcTo(x, y, x + tl, y, tl);
    this.closePath();
    return this;
  };
}
// 2) any uncaught error paints itself onto the page — no more silent black
//    screens on phones with no devtools.
window.addEventListener('error', function (e) {
  try {
    let d = document.getElementById('errbox');
    if (!d) {
      d = document.createElement('div');
      d.id = 'errbox';
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#5a1010;color:#fff;font:11px/1.4 monospace;padding:10px;white-space:pre-wrap;word-break:break-all;';
      document.body.appendChild(d);
    }
    d.textContent += (e.message || String(e.type)) + '  @ ' + String(e.filename || '').split('/').pop() + ':' + e.lineno + '\n';
  } catch (_) { }
});
