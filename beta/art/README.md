# Runefall painted backdrops (Tier-2 art)

Drop a PNG here and it ships on the next deploy — no code change. The game
loads these at boot and replaces the painted-in-code skyline; a missing file
just means the procedural fallback stays.

| file | realm |
|---|---|
| `backdrop_glade.png` | Verdant Glade |
| `backdrop_tundra.png` | Frozen Tundra |
| `backdrop_cinder.png` | Cinder Wastes |

**Format:** wide panorama, ~2048×1024 (2:1). The game scales it to full
screen width and anchors the BOTTOM edge to the enemy row's grass line —
phones show roughly the bottom quarter, desktops more. So compose the hero
detail (treeline, peaks, ruins) in the bottom band and let the upper area
be calm sky. Keep it dark/muted enough that the white HP chips and mob
sprites read on top. Compress before committing (repo is size-constrained).

MJ prompts ready to fire: `~/runefall/BACKDROP-PROMPTS.md`
