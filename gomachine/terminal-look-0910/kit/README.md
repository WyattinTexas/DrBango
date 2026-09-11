# COMPUTER — the Starship Commander terminal look (9/10/2026)

Terminal.app dressed as the ship's computer while running Claude Code. Readability first: warm
near-white text on an opaque dark navy, amber only for emphasis and the cursor, no blur, no blink,
no beeps. Font: Atkinson Hyperlegible Mono 14 (Braille Institute; the monospace font with
published low-vision legibility testing behind it; OFL license in this folder).

## Commands (any new shell; `source ~/computer/computer.zsh` in an old one)

| command | what it does |
|---|---|
| `computer on` | every open Terminal window and all new ones -> the Computer look; macOS Dark Mode on (the window header is system chrome, Dark Mode is the only way to darken it) |
| `computer off` | back to the previous look (Basic) and the previous appearance mode |
| `computer green` / `computer red` | the green-phosphor variant / the cream-and-red variant |
| `computer status` | which profile is the default right now |
| `computer` | the boot screen, then `claude` in this shell's lane (any args pass through) |

## Files

- `make-profiles.py` builds the three `.terminal` files (colors and font archived by JXA).
- `install.sh` regenerates and re-imports them. Terminal never replaces a same-named profile on
  import (it appends " 1"), so the script deletes the old Computer sets first.
- `look.sh <profile> [restore]` applies a profile to every tab plus default/startup; `restore`
  also puts the saved appearance mode back.
- `boot.sh` the boot screen (256-color; half-block pixel logo, fits 80 columns).
  `COMPUTER_FAST=1` skips the reveal.
- `.previous` / `.previous-dark` the pre-Computer default profile and dark-mode state.

## Limits

- The window title and tab bar are macOS chrome; Terminal.app cannot color them. Dark Mode is the
  only lever. A terminal that draws its own chrome (Ghostty, iTerm2) could go further.
- Terminal.app is 256-color, not truecolor; the profile palette is exact, escape-code art is not.
- Claude Code's own status line (the teal account bar) is untouched on purpose: it is how the ten
  accounts tell themselves apart.
- Cmd + / Cmd - resize the text per window if 14 is not the size you want; the profile default
  is in `make-profiles.py`.
