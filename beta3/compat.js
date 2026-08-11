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
// 2) any uncaught error (or promise rejection) paints itself onto the page —
//    no more silent black screens on phones with no devtools. Tap to dismiss.
function ssPaint(msg, bg) {
  try {
    let d = document.getElementById('errbox');
    if (!d) {
      d = document.createElement('div');
      d.id = 'errbox';
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:' + (bg || '#5a1010') + ';color:#fff;font:11px/1.4 monospace;padding:10px;padding-top:max(10px,env(safe-area-inset-top));white-space:pre-wrap;word-break:break-all;';
      d.addEventListener('pointerdown', function () { d.remove(); });
      document.body.appendChild(d);
    }
    d.textContent += msg + '\n';
  } catch (_) { }
}
var SS_DIAG_ON = /[?&]diag=1/.test(location.search);
window.addEventListener('error', function (e) {
  // "Script error." with no filename = a masked cross-origin error we cannot
  // read or act on — in Firefox iOS these come from the browser's own
  // injected scripts. Don't alarm players; surface only in ?diag=1.
  var masked = !e.filename && (!e.message || e.message === 'Script error.');
  if (masked) {
    if (SS_DIAG_ON && window.SSDIAG) window.SSDIAG('masked cross-origin error (browser/CDN internals) — ignored');
    return;
  }
  ssPaint((e.message || String(e.type)) + '  @ ' + String(e.filename || '').split('/').pop() + ':' + e.lineno + '  (tap to dismiss)');
});
window.addEventListener('unhandledrejection', function (e) {
  var r = e && e.reason;
  ssPaint('PROMISE: ' + (r && (r.message || r.code || String(r)) || '?') + '  (tap to dismiss)');
});

// 3) ?diag=1 — a live on-screen readout so a phone screenshot tells the whole
//    story: environment at boot, then whatever the game reports via SSDIAG().
if (/[?&]diag=1/.test(location.search)) {
  window.SSDIAG = function (msg) {
    try {
      let d = document.getElementById('diagbox');
      if (!d) {
        d = document.createElement('div');
        d.id = 'diagbox';
        d.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99998;background:rgba(10,16,40,0.88);color:#cfe0ff;font:10px/1.45 monospace;padding:8px;padding-bottom:max(8px,env(safe-area-inset-bottom));white-space:pre-wrap;word-break:break-all;pointer-events:none;';
        document.body.appendChild(d);
      }
      d.textContent += msg + '\n';
      const lines = d.textContent.split('\n');
      if (lines.length > 14) d.textContent = lines.slice(lines.length - 14).join('\n');
    } catch (_) { }
  };
  window.SSDIAG('ua ' + navigator.userAgent.replace(/Mozilla\/5\.0 |\(KHTML, like Gecko\) /g, ''));
  window.SSDIAG('vp ' + window.innerWidth + 'x' + window.innerHeight + ' dpr ' + window.devicePixelRatio);
  window.SSDIAG('reduce-motion ' + !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches));
  try {
    var cv = document.createElement('canvas');
    window.SSDIAG('webgl2 ' + !!cv.getContext('webgl2') + ' · webgl1 ' + !!(cv.getContext('webgl') || cv.getContext('experimental-webgl')));
  } catch (_) { window.SSDIAG('webgl probe failed'); }
} else {
  window.SSDIAG = function () { };
}
