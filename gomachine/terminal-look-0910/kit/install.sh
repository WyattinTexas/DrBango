#!/bin/zsh
# (Re)install the Computer Terminal profiles from the .terminal files in this folder, then apply.
# Terminal never replaces a same-named profile on import (it appends " 1"), so this deletes the
# old Computer* (and legacy Bebop*) sets first. Open windows briefly show Basic while the swap happens.
set -e
# Font: Atkinson Hyperlegible Mono (Braille Institute, OFL) is archived straight into the plist.
cd "$HOME/computer"
python3 make-profiles.py

osascript <<'AS'
tell application "Terminal"
  repeat with w in windows
    repeat with t in tabs of w
      set current settings of t to settings set "Basic"
    end repeat
  end repeat
  set default settings to settings set "Basic"
  set startup settings to settings set "Basic"
  repeat with s in (get every settings set)
    if (name of s) starts with "Computer" or (name of s) starts with "Bebop" then delete s
  end repeat
end tell
AS

before="$(osascript -e 'tell application "Terminal" to get id of every window' | tr -d ' '),"
for f in "Computer Green" "Computer Red" "Computer Day" "Computer"; do open "$f.terminal"; sleep 0.8; done
sleep 1.5

osascript - "$before" <<'AS'
on run argv
  set keepText to item 1 of argv
  tell application "Terminal"
    -- collect ids first, then close by id: closing while iterating "every window" shifts the
    -- indexes and can close the wrong window.
    set victims to {}
    repeat with w in (get every window)
      set wid to id of w
      if keepText does not contain ((wid as string) & ",") then set end of victims to wid
    end repeat
    repeat with wid in victims
      close (window id wid)
    end repeat
    return "installed: " & (name of every settings set as string)
  end tell
end run
AS

"$HOME/computer/look.sh" Computer
