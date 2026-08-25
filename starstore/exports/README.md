# THE STAR STORE — the example sky, exported (64 pieces, 2026-08-25)

Every piece on THE SKY SHELF at https://drbango.com/starstore/ , exported exactly as the store's EXPORT button prints it.
Open `index.html` for the gallery. Folders are the shelf's rails: upgrade · world · deepsky · event · menu · sign · new.

Per piece:
- `<id>.png` — the card (800 px), how it looks at rest
- `<id>.starstore.json` — the store's own file: IMPORT it on the desk to edit
- `<id>.js` — the game block: pastes INSIDE the SS_BEASTS literal in data.js (or REPLACES a record / a sign's stars)
- `<id>.md` — the jumpr card: what it is, where it lives, the data, registrations, proof, what does not move. Line 1 says
  READY TODAY (fire any time) or NEEDS SS-SKY-01 FIRST (the game learns the new sky pieces in one build first).
- `<id>.plain.js` + `<id>.plain.md` — the PLAIN COPY twin (stars, lines, eyes, colours only — the game can draw it today);
  the waltzes, moons, nebulae and named stars arrive when SS-SKY-01 lands and the full card is queued.

`ALL-cards.md` and `ALL-game-blocks.js` are every card / block in one file, in shelf order.
Nothing here is in the game yet — a card goes into the Jumper queue, a build session does the rest.
