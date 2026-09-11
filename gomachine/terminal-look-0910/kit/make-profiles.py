#!/usr/bin/env python3
"""Generate Terminal.app profiles (.terminal plists) for the Computer look (Starship Commander).

Colors and the font are NSKeyedArchiver blobs; we ask JXA (osascript) to encode them
so the plist is exactly what Terminal writes itself. Run, then `open <name>.terminal`.
"""
import json, plistlib, subprocess, base64, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))

def archive_all(colors, font_name, font_size):
    """One osascript call: returns {key: base64} for every color + the font."""
    spec = {k: [*hex_to_rgb(v[0]), v[1]] for k, v in colors.items()}
    js = r'''
ObjC.import("AppKit");
function b64(obj){ const d=$.NSKeyedArchiver.archivedDataWithRootObjectRequiringSecureCodingError(obj,false,null); return d.base64EncodedStringWithOptions(0).js; }
const spec = JSON.parse(%s);
const out = {};
for (const k in spec){ const [r,g,b,a]=spec[k]; out[k]=b64($.NSColor.colorWithSRGBRedGreenBlueAlpha(r,g,b,a)); }
const f = $.NSFont.fontWithNameSize(%s, %s);
out.Font = f.isNil() ? null : b64(f);
JSON.stringify(out);
''' % (json.dumps(json.dumps(spec)), json.dumps(font_name), font_size)
    r = subprocess.run(['osascript', '-l', 'JavaScript', '-e', js], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit('osascript failed: ' + r.stderr)
    return json.loads(r.stdout.strip())

def build(name, palette, font_name='AtkinsonHyperlegibleMono-Regular', font_size=14, blur=0.0, cols=112, rows=34):
    # palette: dict of key -> (hex, alpha)
    blobs = archive_all(palette, font_name, font_size)
    if not blobs.get('Font'):
        sys.exit(f'font {font_name} not found')
    p = {
        'name': name,
        'type': 'Window Settings',
        'ProfileCurrentVersion': 2.07,
        'Font': base64.b64decode(blobs.pop('Font')),
        'FontAntialias': True,
        'FontWidthSpacing': 1.06,   # wider letter spacing: the one dyslexia lever with strong evidence
        'FontHeightSpacing': 1.08,  # >1.15 showed cursor residue with Atkinson; 1.08 verified by screenshot
        'BackgroundBlur': blur,
        'BackgroundSettingsForInactiveWindows': False,
        'CursorType': 0,          # block
        'CursorBlink': False,
        'BlinkText': False,
        'Bell': False,
        'VisualBell': True,       # the screen flashes instead of beeping
        'VisualBellOnlyWhenMuted': False,
        'columnCount': cols,
        'rowCount': rows,
        # Titles: show ONLY what the app sets (Claude Code sets "<glyph> <summary>"); Terminal adds nothing.
        'ShowWindowSettingsNameInTitle': False,
        'ShowActiveProcessInTitle': False,
        'ShowActiveProcessArgumentsInTitle': False,
        'ShowShellCommandInTitle': False,
        'ShowTTYNameInTitle': False,
        'ShowDimensionsInTitle': False,
        'ShowRepresentedURLInTitle': False,
        'ShowRepresentedURLPathInTitle': False,
        'ShowActiveProcessInTabTitle': False,
        'ShowActiveProcessArgumentsInTabTitle': False,
        'ShowShellCommandInTabTitle': False,
        'ShowTTYNameInTabTitle': False,
        'ShowRepresentedURLInTabTitle': False,
        'ShowRepresentedURLPathInTabTitle': False,
        'useOptionAsMetaKey': True,
    }
    for k, b in blobs.items():
        p[k] = base64.b64decode(b)
    out = HERE / f'{name}.terminal'
    with open(out, 'wb') as fh:
        plistlib.dump(p, fh)
    print('wrote', out)

# ---- the three looks -------------------------------------------------------
# key names are Terminal's own plist keys.

def pal(bg, text, bold, cursor, sel, ansi):
    """ansi: 16 hex colors in order black red green yellow blue magenta cyan white, then bright x8"""
    names = ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']
    d = {
        'BackgroundColor': bg,
        'TextColor': (text, 1.0),
        'TextBoldColor': (bold, 1.0),
        'CursorColor': (cursor, 1.0),
        'SelectionColor': sel,
    }
    for i, n in enumerate(names):
        d[f'ANSI{n}Color'] = (ansi[i], 1.0)
        d[f'ANSIBright{n}Color'] = (ansi[8 + i], 1.0)
    return d

# BEBOP: the cockpit. Amber phosphor on deep blue-black glass.
BEBOP = pal(
    bg=('#161a21', 1.0), text='#e8e3d8', bold='#f2c987', cursor='#e8a94a', sel=('#e8a94a', 0.25),
    ansi=['#1e232b', '#e5736c', '#97c98a', '#e9c06a', '#79aee0', '#cba3d6', '#7ccdc9', '#e8e3d8',
          '#7d8794', '#f29088', '#b5e0a6', '#f3d48f', '#9ac4ee', '#dfbfe6', '#9fe0dc', '#f7f3ea'])

# BEBOP ED: Ed's Tomato. Green phosphor, darker glass.
BEBOP_ED = pal(
    bg=('#121a14', 1.0), text='#dde8d6', bold='#a6e6a4', cursor='#8fd18f', sel=('#8fd18f', 0.25),
    ansi=['#1a241c', '#e5807a', '#97d697', '#dcd78e', '#7bbcd6', '#c9a8d6', '#84d8d1', '#dde8d6',
          '#7a8a7e', '#f29d97', '#bcf2ba', '#ede9ac', '#9dd1e8', '#dcc3e8', '#a5ebe4', '#f2f8ee'])

# BEBOP SESSION: the title card. Cream on black, red for the cuts.
BEBOP_SESSION = pal(
    bg=('#1b1614', 1.0), text='#ece4d6', bold='#ffffff', cursor='#d9534f', sel=('#d9534f', 0.25),
    ansi=['#241e1b', '#dc6a66', '#a3cf92', '#eac66e', '#7ea8d6', '#d0a3bb', '#7fc9c5', '#ece4d6',
          '#857672', '#f0827d', '#bde3ad', '#f5d68f', '#9dbfe6', '#e3bdd0', '#a2dcd8', '#ffffff'])

# COMPUTER DAY: dark text on cream for daytime reading (dyslexia style guides prefer this polarity).
COMPUTER_DAY = pal(
    bg=('#f3ecdc', 1.0), text='#2b2a26', bold='#7a4f00', cursor='#c47f00', sel=('#c47f00', 0.25),
    ansi=['#3a3835', '#b3261e', '#2f7a2f', '#8a6d00', '#2b5fa8', '#7a3e8a', '#1f7a7a', '#4a4741',
          '#6b6760', '#c9302c', '#2f8f2f', '#a37f00', '#1f6fd0', '#9a4faa', '#218f8f', '#2b2a26'])

if __name__ == '__main__':
    build('Computer', BEBOP)
    build('Computer Green', BEBOP_ED)
    build('Computer Red', BEBOP_SESSION)
    build('Computer Day', COMPUTER_DAY)
