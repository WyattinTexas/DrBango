# FLOOP'S LAB AND SARGE'S GEAR · Green vs Tan

One page for the game designer with every invention of Floop's Lab (its film, what it does, where it comes from, what it costs) and every piece of gear Sarge can carry or wear (the five irons, the rack rail by rail with THE MAGIC LENS's ▲/▼ rows, where each piece is won). Wyatt's ask (Nov 2, 2026): "a good-looking array of all the Floop's Lab inventions with their videos, and then also all the gear that can go on Sarge … clickable and easy to see what everything does … for our game designer."

It is served at

- https://playgvt.net/lab-and-gear/
- https://drbango.com/gvt/lab-and-gear/

The page loads no font, script, image or data from anywhere: every picture is inline. The films are the lab's own television clips beside the game at the mirror root (`../lab-<id>.webm`, `.mp4`, `.jpg`), so a copy of this folder plays them only next to a copy of those files; the self-contained copy sent to Discord reads them from playgvt.net instead.

## What is on the page

- **INVENTIONS**: the lab's rooms in the order they open (the men, then Sarge's irons, HEROES, the plane, the jeep, the tank), each room with its door (the level or the iron that opens it) and its parts as cards: the film playing as it scrolls into view, the part's picture, its name, the man it fits, the card's one-line slogan, the ▲/▼ short rows, and the price or WON with where. Shelved parts (off the bench today) are shown and marked. A tap opens the part's sheet: the film with controls, the long ▲/▼ lines, the room, the price or where it is won, the lock line, the Boss Lab note, the film's files. ‹ › or the arrow keys walk the parts; Escape closes; the address bar carries `#p-<id>` so a sheet can be linked.
- **SARGE'S GEAR**: WEAPONS (the five irons: Sarge holding each, the iron alone, when it opens, the day-one numbers, the faces it grows into, its room in the lab), then the rack's rails (HELMETS AND HATS · FACE · BODY ARMOR · OVER THE ARMOR · GLOVES · LEGS · BOOTS · SOCKS), every piece sold or won with its ▲/▼ rows under the name, and ALSO ON HIM (the jet pack, the saber's crystals and their powers, the Claymore's philosophies, the three mannequins, the gear sets). A tap opens the piece's sheet: the rows, the price or the win, the win line, what it cannot be worn with.
- **The filter row** (sticky): the section, a ROOM or RAIL select, ALL · SOLD · WON · SHELVED, a search box over every word on the cards, and FILMS PLAY / PAUSED. Dark mode follows the system or the Theme control.

## What is in this folder

- `index.html` the page (markup, style and a small script; no framework; one file).
- `README.md` this file.

## How it is made

`design/lab-gear-sheet-1103/kit/run.sh`: `read.mjs` boots HEAD's client headless (Chrome for Testing, muted) and reads the game's own tables (the lab's rooms by `labSecs`'s rule, `ENH_INFO` / `ENH_SHORT` / `ENH_COST` / `TROPHY_IDS` and the cards' WON AT footers, `enhPartSVG`; `SARGE_WEAPONS`, `sargeStats`, the WEAPONS rail's pictures; `OUTFIT_SLOTS`, `OUTFIT_INFO`, `lensRows`, the earn lanes, `outfitPartSVG`; the films by name beside index.html at the mirror root) into `kit/out/data.json`; `build.py` lays the page out from that file; `prove.mjs` proves it on Chrome for Testing and WebKit. Nothing on the page is typed by hand. The page says which client it was read from; rebuild it when the lab or the rack grows.

No file here carries a key, a token, an e-mail address, a home path, a machine name or a chat id.
