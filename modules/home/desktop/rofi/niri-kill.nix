{ pkgs, ... }:
{
  home.packages = with pkgs; [
    jq
    (writeShellScriptBin "rofi-niri-kill" ''
      if [ $# -eq 0 ]; then
        # Use 'cat' to buffer and ensure exit 0
        ${pkgs.niri}/bin/niri msg -j windows 2>/dev/null | \
        ${pkgs.jq}/bin/jq -r '.[] | select(.app_id != null) | "\(.id)\t\(.app_id)\t\(.title)"' | \
        while IFS=$'\t' read -r id app title; do
          [ -z "''${id}" ] && continue

          # -- FILTER UTILITIES --
          case "''${app}" in
            xwayland-satellite|swappy|grim|slurp|wl-clipboard|cliphist|swayosd-server|udiskie|swww-daemon|polkit-mate-authentication-agent-1|waybar) continue ;;
          esac

          # -- MAP ICON (simple lowercase fallback) --
          icon="''${app,,}"
          case "''${app}" in
            dev.zed.Zed) icon="zed" ;;
            vesktop|com.discordapp.Discord) icon="discord" ;;
            vivaldi-stable) icon="vivaldi" ;;
            deezer-enhanced) icon="audio-x-generic" ;;
          esac

          # -- CLEAN TITLE --
          safe_title=$(echo "''${title}" | ${pkgs.gnused}/bin/sed 's/&/\\&amp;/g; s/</\\&lt;/g; s/>/\\&gt;/g' | cut -c1-40)
          [ ''${#title} -gt 40 ] && safe_title="''${safe_title}..."

          # -- OUTPUT WITH LITERAL BYTES --
          # Use printf for display, then printf with actual byte values
          printf "%s (%s)" "''${app}" "''${safe_title}"
          printf "\\0"  # Null byte
          printf "icon\\037%s\\037info\\037%s\\n" "''${icon}" "''${id}"
        done
      else
        # -- KILL MODE --
        if [ -n "$ROFI_INFO" ] && [ "$ROFI_INFO" != "none" ]; then
          ${pkgs.niri}/bin/niri msg action close-window --id "$ROFI_INFO"
        fi
      fi
    '')
  ];
}
