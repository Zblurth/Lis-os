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
    pkgs.findutils # For xargs
    pkgs.coreutils # For basename, sort

    # ---------------------------------------------------
    # THEME MANAGER
    # Handles applying the wallpaper and generating colors
    # ---------------------------------------------------
    (pkgs.writeShellScriptBin "theme-manager" ''
      set -e
      IMG="$1"
      if [ -z "$IMG" ]; then echo "Usage: theme-manager <path>"; exit 1; fi

      # 1. Update SWWW (Wallpaper Daemon)
      if ! pgrep -x swww-daemon > /dev/null; then swww-daemon & sleep 0.5; fi
      swww img "$IMG" --transition-type grow --transition-pos 0.5,0.5 --transition-fps 60 --transition-duration 2

      # 2. System Cache (Full Resolution Symlink)
      # Used by lockscreen, matugen, etc.
      ln -sf "$IMG" "$HOME/.cache/current_wallpaper.jpg"

      # 3. Rofi Sidebar Cache (Cropped & Resized)
      # Generates a 640px wide, 1080px tall centered crop.
      # The '^' ensures it fills the dimension, -extent crops the excess.
      ${pkgs.imagemagick}/bin/convert "$IMG" -resize ^640x1080 -gravity center -extent 640x1080 "$HOME/.cache/rofi-launcher.jpg"

      # 4. Generate Colors (Matugen)
      matugen image "$IMG"

      # 5. Reload Niri Config
      systemctl --user start niri-config-assembler.service
      sync
      niri msg action load-config-file

      notify-send "Theme Active" "$(basename "$IMG")" -i "$IMG"
    '')

    # ---------------------------------------------------
    # WALL SELECT
    # Rofi menu to browse and select wallpapers
    # ---------------------------------------------------
    (pkgs.writeShellScriptBin "wall-select" ''
      # ==================== CONFIGURATION ====================
      # These MUST match the values in WallSelect.rasi for pixel-perfect layout
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
      # Uses parallel processing (xargs -P) for maximum speed
      echo "Generating thumbnails (parallelized)..."
      find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
      xargs -0 -P $(nproc) -I {} sh -c '
        img="{}"
        filename=$(basename "$img")
        cache="$CACHE_DIR/$filename"

        # Generate 3:4 aspect ratio thumbnail if missing or older than 7 days
        if [ ! -f "$cache" ] || [ $(find "$cache" -mtime +7) ]; then
          # -thumbnail is faster than -resize (strips metadata in one pass)
          # FIXED: Escaped GEO here as well using ''${GEO}
          convert "$img" -thumbnail "''${GEO}^" -gravity center -extent "''${GEO}" "$cache"
        fi
      '

      # ==================== ROFI SELECTOR ====================
      # Build menu list with icons, sort alphabetically
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
