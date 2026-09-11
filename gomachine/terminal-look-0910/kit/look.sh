#!/bin/zsh
# usage: look.sh "<profile name>" [restore]
# Applies the profile to every open Terminal tab and makes it the default + startup profile.
# A Computer profile also turns macOS Dark Mode on (the window header is system chrome; dark mode is
# the only way to darken it). `restore` puts the previous appearance back. State in ~/computer/.previous*.
prof="$1"; mode="$2"
[[ -z "$prof" ]] && { print "usage: look.sh <profile> [restore]"; exit 1; }
prev="$(osascript -e 'tell application "Terminal" to name of default settings' 2>/dev/null)"
if [[ -n "$prev" && "$prev" != Computer* && "$prev" != Bebop* ]]; then
  print -- "$prev" > "$HOME/computer/.previous"
  osascript -e 'tell application "System Events" to tell appearance preferences to get dark mode' > "$HOME/computer/.previous-dark" 2>/dev/null
fi
osascript - "$prof" <<'AS'
on run argv
  set p to item 1 of argv
  tell application "Terminal"
    set default settings to settings set p
    set startup settings to settings set p
    repeat with w in windows
      repeat with t in tabs of w
        set current settings of t to settings set p
      end repeat
    end repeat
  end tell
  return "Terminal look: " & p
end run
AS
if [[ "$mode" == restore ]]; then
  want="$(cat "$HOME/computer/.previous-dark" 2>/dev/null || print false)"
elif [[ "$prof" == *Day* ]]; then
  want=false
else
  want=true
fi
osascript -e "tell application \"System Events\" to tell appearance preferences to set dark mode to $want" >/dev/null 2>&1 && print "Dark mode: $want"
