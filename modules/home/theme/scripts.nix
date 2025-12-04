{ pkgs, config, ... }:
let
  wallDir = "${config.home.homeDirectory}/Pictures/Wallpapers";
  cacheDir = "${config.home.homeDirectory}/.cache/wall-thumbs";
  rofiTheme = "${config.home.homeDirectory}/.config/rofi/WallSelect.rasi";
in
{
  home.packages = [
    pkgs.libnotify
    pkgs.imagemagick
    pkgs.findutils
    pkgs.coreutils
    (pkgs.writeShellScriptBin "theme-manager" ''
      set -e
      IMG="$1"
      if [ -z "$IMG" ]; then echo "Usage: theme-manager <path>"; exit 1; fi
      if ! pgrep -x swww-daemon > /dev/null; then swww-daemon & sleep 0.5; fi
      swww img "$IMG" --transition-type grow --transition-pos 0.5,0.5 --transition-fps 60 --transition-duration 2
      ln -sf "$IMG" "$HOME/.cache/current_wallpaper.jpg"
      ${pkgs.imagemagick}/bin/convert "$IMG" -resize 640x "$HOME/.cache/current_wallpaper.jpg"
      matugen image "$IMG"
      systemctl --user start niri-config-assembler.service
      sync
      niri msg action load-config-file
      notify-send "Theme Active" "$(basename "$IMG")" -i "$IMG"
    '')
    (pkgs.writeShellScriptBin "wall-select" ''
      # ==================== CONFIGURATION ====================
      THUMB_WIDTH=415
      THUMB_HEIGHT=550
      # FIXED: Use ''${...} to escape shell variables in Nix
      export GEO="''${THUMB_WIDTH}x''${THUMB_HEIGHT}"

      # ==================== PATH & SETUP ====================
      export PATH=${pkgs.imagemagick}/bin:${pkgs.coreutils}/bin:${pkgs.rofi}/bin:${pkgs.findutils}/bin:${pkgs.libnotify}/bin:$PATH
      # FIXED: Export this so the xargs subshell can see it
      export CACHE_DIR="${cacheDir}"

      mkdir -p "$CACHE_DIR"

      # Verify wallpaper directory exists
      if [ ! -d "${wallDir}" ]; then
        notify-send "Error" "Wallpaper directory not found: ${wallDir}" -u critical
        exit 1
      fi

      # ==================== THUMBNAIL GENERATION ====================
      echo "Generating thumbnails (parallelized)..."
      find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
      xargs -0 -P $(nproc) -I {} sh -c '
        img="{}"
        filename=$(basename "$img")
        cache="$CACHE_DIR/$filename"

        # Generate 3:4 aspect ratio thumbnail if missing or older than 7 days
        if [ ! -f "$cache" ] || [ $(find "$cache" -mtime +7) ]; then
          # FIXED: escaped GEO here as well using ''${GEO}
          convert "$img" -thumbnail "''${GEO}^" -gravity center -extent "''${GEO}" "$cache"
        fi
      '

      # ==================== ROFI SELECTOR ====================
      SELECTED=$( \
        find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
        xargs -0 basename -a | \
        sort | \
        while IFS= read -r filename; do
            printf "%s\0icon\x1f%s/%s\n" "$filename" "$CACHE_DIR" "$filename"
        done | \
        ${pkgs.rofi}/bin/rofi -dmenu -theme "${rofiTheme}" -p "Select Wallpaper" -show-icons \
      )

      # ==================== APPLY THEME ====================
      if [ -n "$SELECTED" ]; then
        theme-manager "${wallDir}/$SELECTED"
      fi
    '')
  ];
}
