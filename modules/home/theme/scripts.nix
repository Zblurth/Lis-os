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

    (pkgs.writeShellScriptBin "theme-manager" ''
      set -e
      IMG="$1"
      if [ -z "$IMG" ]; then echo "Usage: theme-manager <path>"; exit 1; fi

      if ! pgrep -x swww-daemon > /dev/null; then swww-daemon & sleep 0.5; fi
      swww img "$IMG" --transition-type grow --transition-pos 0.5,0.5 --transition-fps 60 --transition-duration 2
      ln -sf "$IMG" "$HOME/.cache/current_wallpaper.jpg"

      matugen image "$IMG"

      systemctl --user start niri-config-assembler.service
      sync
      niri msg action load-config-file

      notify-send "Theme Active" "$(basename "$IMG")" -i "$IMG"
    '')

    (pkgs.writeShellScriptBin "wall-select" ''
      export PATH=${pkgs.imagemagick}/bin:${pkgs.coreutils}/bin:${pkgs.rofi}/bin:${pkgs.findutils}/bin:$PATH
      mkdir -p "${cacheDir}"
      
      echo "Generating thumbnails..."
      find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
      xargs -0 -P $(nproc) -I {} sh -c '
        img="{}"
        filename=$(basename "$img")
        cache="${cacheDir}/$filename"
        if [ ! -f "$cache" ]; then
          convert "$img" -resize 500x500^ -gravity center -extent 500x500 "$cache"
        fi
      '

      # Launch Rofi (Gh0stzk Logic: xargs basename -> sort -> loop)
      # This avoids the complex read -d logic that breaks Nix
      SELECTED=$( \
        find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
        xargs -0 basename -a | \
        sort | \
        while IFS= read -r filename; do
            # \0 separates text from properties, \x1f separates keys
            printf "%s\0icon\x1f%s/%s\n" "$filename" "${cacheDir}" "$filename"
        done | \
        rofi -dmenu -theme "${rofiTheme}" -p "Select Wallpaper" -show-icons \
      )

      if [ -n "$SELECTED" ]; then
        theme-manager "${wallDir}/$SELECTED"
      fi
    '')
  ];
}
