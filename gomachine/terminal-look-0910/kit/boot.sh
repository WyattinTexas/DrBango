#!/bin/zsh
# COMPUTER boot screen (Starship Commander). Terminal.app is 256-color only, so the palette
# uses 38;5;N. The logo is 5x5 pixel letters painted with background-colored cells, which
# stay seam-free in any font. Wide windows (>= 100 columns) get 2-column pixels; narrower
# windows get 1-column pixels. COMPUTER_FAST=1 skips the reveal delays.

A=$'\e[38;5;214m'   # amber
D=$'\e[38;5;136m'   # dim amber
C=$'\e[38;5;223m'   # cream
G=$'\e[38;5;114m'   # radar green
K=$'\e[38;5;245m'   # grey
B=$'\e[1m'
X=$'\e[0m'
PX=$'\e[48;5;214m'  # lit pixel
SH=$'\e[48;5;94m'   # shadow pixel

pause() { [[ -n "$COMPUTER_FAST" ]] || sleep "${1:-0.06}"; }

typeset -A F
F[C]=".###. #.... #.... #.... .###."
F[O]=".###. #...# #...# #...# .###."
F[M]="#...# ##.## #.#.# #...# #...#"
F[P]="####. #...# ####. #.... #...."
F[U]="#...# #...# #...# #...# .###."
F[T]="##### ..#.. ..#.. ..#.. ..#.."
F[E]="##### #.... ####. #.... #####"
F[R]="####. #...# ####. #.#.. #..#."

word="COMPUTER"
typeset -a rows; rows=("" "" "" "" "")
for (( i=1; i<=${#word}; i++ )); do
  parts=(${=F[${word[i]}]})
  for r in 1 2 3 4 5; do rows[$r]+="${parts[$r]}."; done
done

cols="${COLUMNS:-$(tput cols 2>/dev/null || print 80)}"
if (( cols >= 100 )); then cell="  "; else cell=" "; fi

paint() {  # $1 pixel row, $2 pixel escape
  local row="$1" px="$2" out="  " i
  for (( i=1; i<=${#row}; i++ )); do
    if [[ "${row[i]}" == "#" ]]; then out+="${px}${cell}${X}"; else out+="${cell}"; fi
  done
  print -- "$out"
}

lane="${CLAUDE_ACCT:-}"
[[ -n "$lane" ]] && lane="  ·  LANE ${lane:u}"
session="$(date +%m%d)"
clock="$(date +%H:%M)"

clear
print ""
for r in 1 2 3 4 5; do paint "${rows[$r]}" "$PX"; pause; done
paint "${rows[5]}" "$SH"; pause 0.2
print ""
print "${K}  ────────────────────────────────────────────────────────────${X}"
print "${C}   SHIP OS  ·  SESSION #${session}${lane}  ·  ${clock}${X}"
print "${K}  ────────────────────────────────────────────────────────────${X}"; pause 0.2
print "${D}   POWER ........ ${G}ONLINE${X}"; pause 0.12
print "${D}   NAV .......... ${C}COURSE LOCKED: MARS${X}"; pause 0.12
print "${D}   COMMS ........ ${C}TREATY ABOARD, ENCRYPTED${X}"; pause 0.12
print "${D}   COMPUTER ..... ${A}WAKING${X}"; pause 0.35
print ""
print "${K}   3 ...${X}"; pause 0.25
print "${K}   2 ...${X}"; pause 0.25
print "${K}   1 ...${X}"; pause 0.25
print "${A}${B}   COMPUTER ONLINE. AWAITING ORDERS, COMMANDER.${X}"
print ""
