# COMPUTER (9/10/2026): the Starship Commander terminal look. Profiles + generator live in ~/computer/.
#   computer          boot screen, then claude in this lane (args pass through)
#   computer on       every Terminal window -> the Computer look (and new windows); Dark Mode on
#   computer off      back to the previous look and appearance
#   computer green    the green-phosphor variant      computer red    the cream-and-red variant
#   computer day      dark text on cream for daytime reading (Dark Mode off)
#   computer status   which look is the default right now
computer() {
  case "${1:-}" in
    on)      "$HOME/computer/look.sh" "Computer" ;;
    off)     "$HOME/computer/look.sh" "$(cat "$HOME/computer/.previous" 2>/dev/null || print Basic)" restore ;;
    green)   "$HOME/computer/look.sh" "Computer Green" ;;
    red)     "$HOME/computer/look.sh" "Computer Red" ;;
    day)     "$HOME/computer/look.sh" "Computer Day" ;;
    status)  osascript -e 'tell application "Terminal" to name of default settings' ;;
    "")      "$HOME/computer/boot.sh"; claude ;;
    *)       "$HOME/computer/boot.sh"; claude "$@" ;;
  esac
}
