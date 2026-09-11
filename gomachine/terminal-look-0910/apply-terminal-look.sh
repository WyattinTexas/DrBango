#!/bin/bash
# apply-terminal-look.sh — put the 9/10/2026 COMPUTER terminal look on this Mac.
# What it is: drbango.com/gomachine/terminal-look-0910/RECIPE.txt
# Idempotent: run it twice and the second run changes nothing. No sudo, no dialogs, no AppleScript.
#   bash apply-terminal-look.sh --dry-run   print the plan, write nothing
#   bash apply-terminal-look.sh             apply
# Needs: macOS, Terminal.app, python3 (the one Xcode CLT installs), the files that ship beside it.
set -eo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY=0; case "${1:-}" in --dry-run|-n) DRY=1 ;; esac
CHANGED=""; NOTES=""
say()  { printf '%s\n' "$*"; }
ok()   { say "  [ok]      $*"; }
plan() { CHANGED="$CHANGED"$'\n'"  - $1"; if (( DRY )); then say "  [dry-run] $1"; else say "  [change]  $1"; fi; }
note() { NOTES="$NOTES"$'\n'"  - $1"; }
run()  { (( DRY )) || "$@"; }   # run "$@" unless --dry-run

[[ "$(uname)" == Darwin ]] || { say "This script is for macOS Terminal.app only."; exit 1; }
command -v python3 >/dev/null || { say "python3 is required (xcode-select --install)."; exit 1; }
(( DRY )) && say "DRY RUN — nothing will be written." || say "Applying the COMPUTER terminal look (9/10/2026)."
say

# ---------------------------------------------------------------- 1. the font
say "1. Font — Atkinson Hyperlegible Mono (Braille Institute, OFL) -> ~/Library/Fonts"
FONT_DIR="$HOME/Library/Fonts"
[[ -d "$FONT_DIR" ]] || { plan "create $FONT_DIR"; run mkdir -p "$FONT_DIR"; }
for f in "$HERE"/AtkinsonHyperlegibleMono-*.ttf; do
  b="$(basename "$f")"
  if [[ -f "$FONT_DIR/$b" ]] && cmp -s "$f" "$FONT_DIR/$b"; then ok "$b already installed"
  else plan "install font $b"; run cp "$f" "$FONT_DIR/$b"; run xattr -c "$FONT_DIR/$b"; fi
done
say

# ---------------------------------------------------------- 2. the profiles
# Terminal.app never REPLACES a same-named profile on import — it silently adds "Name 1".
# So: absent -> import with `open` (Terminal's own importer; it opens one window per file);
#     same   -> nothing;
#     differs-> overwrite the entry through `defaults write ... -dict-add` (takes effect after Terminal is relaunched).
say "2. Terminal profiles — Computer (the look), Computer Green, Computer Red, Computer Day"
profile_state() {  # prints absent | same | differs
python3 - "$1" <<'PY'
import sys, plistlib, subprocess
want = plistlib.load(open(sys.argv[1], 'rb'))
try:
    cur = plistlib.loads(subprocess.run(['defaults', 'export', 'com.apple.Terminal', '-'], capture_output=True, check=True).stdout)
except Exception:
    cur = {}
have = (cur.get('Window Settings') or {}).get(want['name'])
IGN = {'ProfileCurrentVersion'}
norm = lambda d: {k: v for k, v in d.items() if k not in IGN}
print('absent' if have is None else 'same' if norm(have) == norm(want) else 'differs')
PY
}
profile_name() { python3 -c "import plistlib,sys;print(plistlib.load(open(sys.argv[1],'rb'))['name'])" "$1"; }
IMPORTED=0; REPLACE=""
for f in "$HERE"/Computer-Green.terminal "$HERE"/Computer-Red.terminal "$HERE"/Computer-Day.terminal "$HERE"/Computer.terminal; do
  name="$(profile_name "$f")"
  case "$(profile_state "$f")" in
    same)    ok "profile '$name' already installed and identical" ;;
    absent)  plan "import profile '$name' (open $(basename "$f"); Terminal opens one window for it)"
             run xattr -d com.apple.quarantine "$f" 2>/dev/null || true
             run open "$f"; run sleep 1.5; IMPORTED=$((IMPORTED+1)) ;;
    differs) REPLACE="$REPLACE $f" ;;
  esac
done
if [[ -n "$REPLACE" ]]; then
  (( IMPORTED )) && run sleep 2   # let Terminal save its own profile list before we overwrite entries in it
  for f in $REPLACE; do
    name="$(profile_name "$f")"
    plan "replace profile '$name' (it exists but differs from $(basename "$f"))"
    run defaults write com.apple.Terminal "Window Settings" -dict-add "$name" "$(plutil -convert xml1 -o - "$f")"
  done
  note "replaced profiles land when Terminal is relaunched; do not edit profiles in Terminal > Settings before that"
fi
(( IMPORTED )) && note "Terminal opened $IMPORTED extra window(s) to import the profiles — close them"
say

# ---------------------------------------------------- 3. default + startup
say "3. Default + Startup profile -> Computer"
for key in "Default Window Settings" "Startup Window Settings"; do
  cur="$(defaults read com.apple.Terminal "$key" 2>/dev/null || true)"
  if [[ "$cur" == Computer ]]; then ok "$key = Computer"
  else plan "$key: '${cur:-<unset>}' -> Computer"; run defaults write com.apple.Terminal "$key" -string Computer; fi
done
say

# ------------------------------------------------------------ 4. dark mode
say "4. macOS Dark Mode (the window header is system chrome; Dark Mode is the only way to darken it)"
if [[ "$(defaults read -g AppleInterfaceStyle 2>/dev/null || true)" == Dark ]]; then ok "Dark Mode is on"
else note "Dark Mode is OFF. Turn it on in System Settings > Appearance > Dark — or run 'computer on' after the relaunch (that uses AppleScript and macOS asks once to let Terminal control System Events). This script does not flip it: no dialogs."; say "  [skip]    Dark Mode is off (see notes)"; fi
say

# ------------------------------------------------------------ 5. the kit
say "5. The 'computer' kit -> ~/computer  (computer on|off|green|red|day|status; bare 'computer' = boot screen + claude)"
KIT="$HOME/computer"
[[ -d "$KIT" ]] || { plan "create ~/computer"; run mkdir -p "$KIT"; }
for f in "$HERE"/kit/computer.zsh "$HERE"/kit/look.sh "$HERE"/kit/boot.sh "$HERE"/kit/make-profiles.py "$HERE"/kit/install.sh "$HERE"/kit/README.md "$HERE"/OFL-AtkinsonHyperlegibleMono.txt; do
  b="$(basename "$f")"
  if [[ -f "$KIT/$b" ]] && cmp -s "$f" "$KIT/$b"; then ok "~/computer/$b up to date"
  else plan "install ~/computer/$b"; run cp "$f" "$KIT/$b"; run xattr -c "$KIT/$b"; fi
done
for f in "$HERE"/Computer.terminal "$HERE"/Computer-Green.terminal "$HERE"/Computer-Red.terminal "$HERE"/Computer-Day.terminal; do
  b="$(profile_name "$f").terminal"      # the kit keeps Terminal's own names: "Computer Green.terminal"
  if [[ -f "$KIT/$b" ]] && cmp -s "$f" "$KIT/$b"; then ok "~/computer/$b up to date"
  else plan "install ~/computer/$b"; run cp "$f" "$KIT/$b"; run xattr -c "$KIT/$b"; fi
done
(( DRY )) || chmod +x "$KIT"/look.sh "$KIT"/boot.sh "$KIT"/install.sh 2>/dev/null || true
say

# -------------------------------------------------------------- 6. zsh
say "6. ~/.zshrc — source the kit (marked block, added once)"
ZSHRC="$HOME/.zshrc"
if [[ -f "$ZSHRC" ]] && grep -q 'terminal-look-0910' "$ZSHRC"; then ok "block '# terminal-look-0910' already present"
else
  plan "append the '# terminal-look-0910' block to ~/.zshrc"
  if ! (( DRY )); then cat >> "$ZSHRC" <<'ZZ'

# terminal-look-0910 (begin) — COMPUTER look 9/10/2026: `computer on|off|green|red|day|status`, bare `computer` = boot screen + claude
[[ -f "$HOME/computer/computer.zsh" ]] && source "$HOME/computer/computer.zsh"
# terminal-look-0910 (end)
ZZ
  fi
fi
say

# ---------------------------------------------------- 7. Claude Code settings
say "7. Claude Code — merge display keys into every ~/.claude*/settings.json (nothing else touched)"
for d in "$HOME"/.claude "$HOME"/.claude-*; do
  s="$d/settings.json"; [[ -f "$s" ]] || continue
  out="$(python3 - "$s" "$DRY" <<'PY'
import json, sys, shutil, os
path, dry = sys.argv[1], sys.argv[2] == '1'
WANT = {"tui": "fullscreen"}          # the only Claude display key the look depends on
try:
    j = json.load(open(path))
except Exception as e:
    print(f"skip (not valid JSON: {e})"); sys.exit(0)
diff = {k: v for k, v in WANT.items() if j.get(k) != v}
if not diff:
    print("ok"); sys.exit(0)
if not dry:
    bak = path + '.bak-terminal-look-0910'
    if not os.path.exists(bak): shutil.copy2(path, bak)
    j.update(diff)
    with open(path, 'w') as fh: json.dump(j, fh, indent=2, ensure_ascii=False); fh.write('\n')
print("set " + ", ".join(f"{k}={v!r} (was {j.get(k) if dry else 'unset'})" for k, v in diff.items()))
PY
)"
  case "$out" in ok) ok "$s" ;; skip*) say "  [skip]    $s: $out" ;; *) plan "$s: $out" ;; esac
done
note "no status-line script is part of this look; the per-account status line stays whatever it is here"
say

# -------------------------------------------------------------- summary
say "================================================================"
if [[ -n "$CHANGED" ]]; then say "$( (( DRY )) && echo 'Would change:' || echo 'Changed:')$CHANGED"; else say "Nothing to change — the look is already applied."; fi
[[ -n "$NOTES" ]] && say "Notes:$NOTES"
say "Relaunch: quit Terminal (Cmd+Q) and open it again. New windows come up in the Computer profile."
say "          Windows already open keep their old look until 'computer on' or a reopen."
say "          Claude Code reads settings.json on its next start; open a NEW shell for the 'computer' command."
exit 0
