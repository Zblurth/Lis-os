{ pkgs, ... }:
{
  home.packages = [
    (pkgs.writeScriptBin "rofi-niri-kill" ''
      #!/usr/bin/env bash
      export LC_ALL=C.UTF-8

      # Kill mode
      if [ -n "''${ROFI_INFO:-}" ]; then
        ${pkgs.niri}/bin/niri msg action close-window --id "$ROFI_INFO"
        exit 0
      fi

      # List mode
      ${pkgs.niri}/bin/niri msg -j windows 2>/dev/null | \
      ${pkgs.jq}/bin/jq -r '.[] | select(.app_id != null) | "\(.id)\t\(.app_id)"' | \
      while IFS=$'\t' read -r id app; do
        [ -z "$id" ] && continue

        # Filter bloat
        case "$app" in
          xwayland-satellite|swappy|grim|slurp|wl-clipboard|cliphist|swayosd*|udiskie|swww*|polkit*|waybar) continue ;;
        esac

        # Map to pretty name and icon
        name="$app"
        icon="application-x-executable"

        case "$app" in
          "dev.zed.Zed") name="Zed"; icon="zed" ;;
          "kitty")       name="Kitty"; icon="kitty" ;;  # <-- FIXED: Use "kitty" icon
          "vesktop")     name="Discord"; icon="discord" ;;
          "vivaldi-stable") name="Vivaldi"; icon="vivaldi" ;;
          "deezer-enhanced") name="Deezer"; icon="deezer" ;;
        esac

        # Output with literal bytes
        printf "%s\0icon\037%s\037info\037%s\n" "$name" "$icon" "$id"
      done || true
    '')
    pkgs.jq
  ];
}
