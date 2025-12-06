{ pkgs, config, ... }:
let
  paletteGenScript = builtins.readFile ./palette-gen.sh;
  wallDir = "${config.home.homeDirectory}/Pictures/Wallpapers";
  cacheDir = "${config.home.homeDirectory}/.cache/wall-thumbs";
  rofiTheme = "${config.home.homeDirectory}/.config/rofi/WallSelect.rasi";
  # Path to the file in your repo (Adjust user path if needed)
  stylixWall = "${config.home.homeDirectory}/Lis-os/modules/home/theme/stylix/wallpaper.jpg";
in
{
  home.packages = [
    (pkgs.writeShellScriptBin "palette-gen" paletteGenScript)

    (pkgs.writeShellScriptBin "palette" ''
      if [ -z "$1" ]; then
        echo "Usage: palette <filename_or_path>"
        exit 1
      fi
      INPUT="$1"
      WALL_DIR="$HOME/Pictures/Wallpapers"
      if [ -f "$INPUT" ]; then TARGET="$INPUT";
      elif [ -f "$WALL_DIR/$INPUT" ]; then TARGET="$WALL_DIR/$INPUT";
      else echo "❌ Image not found."; exit 1; fi
      palette-gen "$TARGET" --preview
    '')

    (pkgs.writeShellScriptBin "theme-engine" ''
      set -e
      IMG="$1"
      echo "[Engine] Processing: $IMG"
      eval "$(palette-gen "$IMG")"
      process() {
        TEMPLATE="$HOME/.config/wal/templates/$1"
        TARGET="$2"
        if [ -f "$TEMPLATE" ]; then
          rm -f "$TARGET" || true
          cp "$TEMPLATE" "$TARGET"
          sed -i "s|{bg}|$BG|g" "$TARGET"
          sed -i "s|{fg}|$FG|g" "$TARGET"
          sed -i "s|{fg_dim}|$FG_DIM|g" "$TARGET"
          sed -i "s|{ui_prim}|$UI_PRIM|g" "$TARGET"
          sed -i "s|{ui_sec}|$UI_SEC|g" "$TARGET"
          sed -i "s|{sem_red}|$SEM_RED|g" "$TARGET"
          sed -i "s|{sem_green}|$SEM_GREEN|g" "$TARGET"
          sed -i "s|{sem_yellow}|$SEM_YELLOW|g" "$TARGET"
          sed -i "s|{sem_blue}|$SEM_BLUE|g" "$TARGET"
          sed -i "s|{syn_key}|$SYN_KEY|g" "$TARGET"
          sed -i "s|{syn_fun}|$SYN_FUN|g" "$TARGET"
          sed -i "s|{syn_str}|$SYN_STR|g" "$TARGET"
          sed -i "s|{syn_acc}|$SYN_ACC|g" "$TARGET"
          sed -i "s|{anchor}|$ANCHOR|g" "$TARGET"
        fi
      }
      process "starship.toml" "$HOME/.config/starship.toml"
      process "kitty.conf"    "$HOME/.cache/wal/colors-kitty.conf"
      process "zed.json"      "$HOME/.config/zed/themes/listheme.json"
      process "vesktop.css"   "$HOME/.config/vesktop/themes/lis.theme.css"

      # Niri Colors
      cat <<EOF > "$HOME/.config/niri/colors.kdl"
      window-rule {
          border {
              active-color "$UI_PRIM"
              inactive-color "$UI_SEC"
              width 2
          }
      }
      EOF

      # Rofi Colors
      cat <<EOF > "$HOME/.config/rofi/colors.rasi"
      * {
          background:     $BG;
          background-alt: $UI_SEC;
          foreground:     $FG;
          selected:       $UI_PRIM;
          text-selected:  $BG;
          active:         $SYN_KEY;
          urgent:         $SEM_RED;
      }
      EOF

      # GTK 3/4 Colors
      cat <<EOF > "$HOME/.config/gtk-3.0/gtk.css"
      @define-color theme_bg_color $BG;
      @define-color theme_fg_color $FG;
      @define-color theme_selected_bg_color $UI_PRIM;
      @define-color theme_selected_fg_color $BG;
      window { background: $BG; color: $FG; }
      view { background: $UI_SEC; color: $FG; }
      headerbar { background: $BG; }
      EOF
      cp "$HOME/.config/gtk-3.0/gtk.css" "$HOME/.config/gtk-4.0/gtk.css"
    '')

    (pkgs.writeShellScriptBin "theme-manager" ''
      set -e
      IMG="$1"
      if [ -z "$IMG" ]; then echo "Usage: theme-manager <path>"; exit 1; fi
      if ! pgrep -x swww-daemon > /dev/null; then swww-daemon & sleep 0.5; fi
      swww img "$IMG" --transition-type grow --transition-pos 0.5,0.5 --transition-fps 60 --transition-duration 2
      ln -sf "$IMG" "$HOME/.cache/current_wallpaper.jpg"
      ${pkgs.imagemagick}/bin/magick "$IMG" -resize ^640x1080 -gravity center -extent 640x1080 "$HOME/.cache/rofi-launcher.jpg" || true
      theme-engine "$IMG"
      systemctl --user start niri-config-assembler.service
      niri msg action load-config-file
      if pgrep -x kitty > /dev/null; then
          kitty @ --to=unix:@mykitty set-colors -a -c ~/.cache/wal/colors-kitty.conf || true
      fi
      notify-send "Theme Active" "$(basename "$IMG")" -i "$IMG"
    '')

    # --- Updated Wall-Select ---
    (pkgs.writeShellScriptBin "wall-select" ''
      THUMB_WIDTH=415
      THUMB_HEIGHT=550
      export PATH=${pkgs.imagemagick}/bin:${pkgs.coreutils}/bin:${pkgs.rofi}/bin:${pkgs.findutils}/bin:${pkgs.libnotify}/bin:$PATH
      export CACHE_DIR="${cacheDir}"
      STYLIX_WALL="${stylixWall}"
      mkdir -p "$CACHE_DIR"

      if [ ! -d "${wallDir}" ]; then
        notify-send "Error" "Wallpaper dir missing: ${wallDir}" -u critical
        exit 1
      fi

      find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
      xargs -0 -P $(nproc) -I {} sh -c '
        img="{}"
        filename=$(basename "$img")
        cache="$CACHE_DIR/$filename"
        if [ ! -f "$cache" ]; then
          magick "$img" -thumbnail "415x550^" -gravity center -extent 415x550 "$cache" 2>/dev/null || true
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
        FULL_PATH="${wallDir}/$SELECTED"

        # 1. Update the Stylix File
        echo "Updating Stylix wallpaper source at $STYLIX_WALL..."
        cp -f "$FULL_PATH" "$STYLIX_WALL"

        # 2. Trigger the runtime theme engine
        theme-manager "$FULL_PATH"

        # 3. Notification reminder
        notify-send "Wallpaper Updated" "Remember to 'git add' the new wallpaper before rebuilding!"
      fi
    '')
  ];
}
