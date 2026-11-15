# THE SCREENING ROOM · Green vs Tan

One page with every film the team has made: the cinematics, the PSA films, the ads and shorts, the promos, Floop's Lab's films, the clips the game plays, and the films made for design passes. Dylan's ask (Nov 14, 2026): "Let's create an accessible dashboard to access all video content that I and other team members have created please."

It is served at

- https://playgvt.net/films/
- https://drbango.com/gvt/films/

The page is unlisted (`noindex`): it opens by its link. It loads no font, script, picture or data from anywhere but this folder and the site's own root.

## What is on the page

- **Seven shelves**, each a grid of cards: CINEMATICS · PSA FILMS · ADS AND SHORTS · PROMOS · FLOOP'S LAB FILMS · CLIPS IN THE GAME · DESIGN PASS FILMS. A shelf shows its first eight films and a SHOW ALL button.
- **A card**: the film's poster, its length, its number (F 001 …), its name, who it is from and when, and where it is.
- **A film's own screen** (tap a card; it takes the whole screen): the film in a player, its facts (number, shelf, from, made, length, shape, where it is, its card, its record in the team's files), every cut (wide, tall, a round's look, a master) with PLAY and SAVE THE FILE, the film before and the next film, COPY A LINK TO THIS FILM, and the film's own page on the website where it has one.
- **Finding a film**: the shelf chips, SEARCH (a title, a name, a number), FROM (Dylan, Isaac, Wyatt, Raziya, the game's own clips), WHERE IT IS (plays here, in the archive), ORDER (the shelf's own, newest, oldest, A to Z, longest). On a phone the search and the three selects fold under one button, so the bar that stays on top is small. The address bar keeps the view (`#s=psa&w=Dylan&f=F021`), so a copied link opens the same shelf, person and film.

## Where a film is

- **IN THE GAME**: the game plays it from the site's root (`../snd-duel.mp4`), so it plays here too.
- **ON THE WEBSITE**: it has a link of its own at the site's root and is not in the game (the files named in `shell/pack/SITE-ONLY.txt`). It plays here.
- **IN THE ARCHIVE**: a finished film kept in the team's files (`design/<kit>/film/`) and not on the website. The page shows its poster and its facts and serves no file. COPY THE ASK copies one line with the film's number, name, cut and file ("Please send me film F 018, …"), to paste in a note to the team.

A film's number never changes (the ledger `design/film-dashboard-1114/kit/numbers.json`): a new film takes the next number.

## For everyone

- Everything works from the keyboard: a skip link, the chips and cards are buttons, Enter opens a film, the arrow keys walk the films, Escape closes the film and the focus goes back to its card.
- The film's screen is the browser's own modal dialog: the page behind it is out of reach while it is open, and Escape closes it even from inside the film's own controls.
- Every button, link, select and field has a name; a card reads as one sentence ("Watch THE DUEL. 30 seconds. From Dylan. In the game. Number F 001."); the count line and the "copied" line are spoken as they change.
- Where a film is, is always said in words, never by colour alone. Text contrast is 4.5 to 1 or better in both themes (the page follows the system's light or dark).
- Every control is 44 by 44 points or bigger. The page fits a 320 point screen, and its words still fit at twice the text size.
- With Reduce Motion on, nothing moves on the page. A film starts only on a tap.
- The films carry no spoken track that needs captions: their words are drawn in the picture.

## What is in this folder

- `index.html` the page (markup, style and a small script; no framework).
- `data.js` the films as `window.FILMS` (made by the kit; never edited by hand).
- `posters/<id>.jpg` a poster for every film whose poster is not already at the site's root (480 points on the long side).
- `README.md` this file.

No file here carries a key, a token, an e-mail address, a home path, a machine name or a chat id.

## How it is made

`design/film-dashboard-1114/kit/build.py` reads the game's files at one commit and sorts every video file:

1. the films the hand-kept list names (`kit/curated.json`: the cinematics, the PSA films, the ads, the promos, a few films kept outside a film folder), cut by cut;
2. the clips at the site's root by their family (`lab-`, `book-`, `prem-`, `pet-`, `spell-`), named by `kit/lab-names.json`;
3. every other film in a design kit's `film/` or `films/` folder, one card a kit (`kit/kits.json`);
4. the rest (look clips, rig and proof footage, sound takes, the capture plates a film is cut from) is counted and left out.

A cut whose bytes also sit at the site's root plays from the website. The census must add up (films on the page + byte copies + left out = every video in the files), or the build stops. A film nobody has named yet still shows, marked NEW, under its file's name.

Refresh it after films land: `python3 design/film-dashboard-1114/kit/build.py` (on a full clone; about a minute), then `node design/film-dashboard-1114/rig/proveFLM.mjs chrome <a server at the repo's root> <out>` and the same with `webkit`.
