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

    # --- Theme Manager Script ---
    (pkgs.writeShellScriptBin "theme-manager" ''
      set -e
      IMG="$1"
      if [ -z "$IMG" ]; then echo "Usage: theme-manager <path>"; exit 1; fi

      # 1. Update Wallpaper
      if ! pgrep -x swww-daemon > /dev/null; then swww-daemon & sleep 0.5; fi
      swww img "$IMG" --transition-type grow --transition-pos 0.5,0.5 --transition-fps 60 --transition-duration 2

      # 2. Update Caches
      ln -sf "$IMG" "$HOME/.cache/current_wallpaper.jpg"
      ${pkgs.imagemagick}/bin/convert "$IMG" -resize ^640x1080 -gravity center -extent 640x1080 "$HOME/.cache/rofi-launcher.jpg"

      # 3. Generate Colors
      matugen image "$IMG"

      # 4. App Reloads
      # Niri
      systemctl --user start niri-config-assembler.service
      niri msg action load-config-file

      # Kitty (Hot Reload)
      if pgrep -x kitty > /dev/null; then
          kitty @ --to=unix:@mykitty set-colors -a -c ~/.config/kitty/colors.conf || true
      fi

      notify-send "Theme Active" "$(basename "$IMG")" -i "$IMG"
    '')

    # --- Wallpaper Selector Script ---
    (pkgs.writeShellScriptBin "wall-select" ''
      THUMB_WIDTH=415
      THUMB_HEIGHT=550
      GEO="415x550"

      export PATH=${pkgs.imagemagick}/bin:${pkgs.coreutils}/bin:${pkgs.rofi}/bin:${pkgs.findutils}/bin:${pkgs.libnotify}/bin:$PATH
      export CACHE_DIR="${cacheDir}"
      mkdir -p "$CACHE_DIR"

      if [ ! -d "${wallDir}" ]; then
        notify-send "Error" "Wallpaper dir missing: ${wallDir}" -u critical
        exit 1
      fi

      echo "Generating thumbnails..."
      find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
      xargs -0 -P $(nproc) -I {} sh -c '
        img="{}"
        filename=$(basename "$img")
        cache="$CACHE_DIR/$filename"
        if [ ! -f "$cache" ]; then
          convert "$img" -thumbnail "415x550^" -gravity center -extent 415x550 "$cache"
        fi
      '

      SELECTED=$( \
        find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
        xargs -0 basename -a | \
        sort | \
        while IFS= read -r filename; do
            printf "%s\0icon\x1f%s/%s\n" "$filename" "$CACHE_DIR" "$filename"
        done | \
        ${pkgs.rofi}/bin/rofi -dmenu -theme "${rofiTheme}" -p "Select Wallpaper" -show-icons \
      )

      if [ -n "$SELECTED" ]; then
        theme-manager "${wallDir}/$SELECTED"
      fi
    '')
  ];
}
