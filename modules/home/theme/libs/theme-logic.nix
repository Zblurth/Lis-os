{ pkgs, config, ... }:
let
  # Import the Bash logic from the external file
  paletteGenScript = builtins.readFile ./palette-gen.sh;

  # Define paths used by the scripts
  wallDir = "${config.home.homeDirectory}/Pictures/Wallpapers";
  cacheDir = "${config.home.homeDirectory}/.cache/wall-thumbs";
  rofiTheme = "${config.home.homeDirectory}/.config/rofi/WallSelect.rasi";
in
{
  home.packages = [
    # ---------------------------------------------------
    # 1. THE GENERATOR (palette-gen)
    # ---------------------------------------------------
    (pkgs.writeShellScriptBin "palette-gen" paletteGenScript)

    # ---------------------------------------------------
    # 2. THE HELPER (palette)
    # Usage: palette <image> -> Shows colors in terminal
    # ---------------------------------------------------
    (pkgs.writeShellScriptBin "palette" ''
      if [ -z "$1" ]; then
        echo "Usage: palette <filename_or_path>"
        echo "Default Dir: ~/Pictures/Wallpapers/"
        exit 1
      fi

      INPUT="$1"
      WALL_DIR="$HOME/Pictures/Wallpapers"

      # Logic: Check absolute path first, then check Wallpaper dir
      if [ -f "$INPUT" ]; then
          TARGET="$INPUT"
      elif [ -f "$WALL_DIR/$INPUT" ]; then
          TARGET="$WALL_DIR/$INPUT"
      else
          echo "❌ Image not found."
          echo "Checked: $INPUT"
          echo "Checked: $WALL_DIR/$INPUT"
          exit 1
      fi

      # Call the generator in preview mode
      palette-gen "$TARGET" --preview
    '')

    # ---------------------------------------------------
    # 3. THE ENGINE (The Processor)
    # Reads Templates -> Fills Colors -> Writes Configs
    # ---------------------------------------------------
    (pkgs.writeShellScriptBin "theme-engine" ''
      set -e
      IMG="$1"
      echo "[Engine] Processing: $IMG"

      # --- A. Load Variables (The Brain) ---
      # This runs palette-gen and imports variables like $BG, $SEM_RED, etc.
      eval "$(palette-gen "$IMG")"

      # --- B. The Processor Function ---
      # process <template_filename> <target_full_path>
      process() {
        TEMPLATE="$HOME/.config/wal/templates/$1"
        TARGET="$2"

        if [ -f "$TEMPLATE" ]; then
          # THE FIX: Forcefully remove the destination first
          # This breaks the read-only Nix symlink so we can write to the file
          rm -f "$TARGET" || true

          cp "$TEMPLATE" "$TARGET"

          # Apply the dictionary
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
        else
          echo "[Skip] Template $1 not found."
        fi
      }

      # --- C. The Job List (Templates) ---
      # These templates are created by your .nix files (starship.nix, kitty.nix, etc.)

      process "starship.toml" "$HOME/.config/starship.toml"
      process "kitty.conf"    "$HOME/.cache/wal/colors-kitty.conf"
      process "zed.json"      "$HOME/.config/zed/themes/listheme.json"
      process "vesktop.css"   "$HOME/.config/vesktop/themes/lis.theme.css"

      # --- D. Legacy/Simple Generators (No Template Needed) ---
      # These are simple enough to keep inline for now

      # NIRI (Borders)
      cat <<EOF > "$HOME/.config/niri/colors.kdl"
      window-rule {
          border {
              active-color "$UI_PRIM"
              inactive-color "$UI_SEC"
              width 2
          }
      }
      EOF

      # ROFI (Colors)
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

      # GTK (Theme)
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

      echo "[Engine] Configuration Applied."
    '')

    # ---------------------------------------------------
    # 4. THE MANAGER (The Orchestrator)
    # Sets Wallpaper -> Calls Engine -> Reloads Apps
    # ---------------------------------------------------
    (pkgs.writeShellScriptBin "theme-manager" ''
      set -e
      IMG="$1"
      if [ -z "$IMG" ]; then echo "Usage: theme-manager <path>"; exit 1; fi

      # 1. Set Wallpaper (SWWW)
      if ! pgrep -x swww-daemon > /dev/null; then swww-daemon & sleep 0.5; fi
      swww img "$IMG" --transition-type grow --transition-pos 0.5,0.5 --transition-fps 60 --transition-duration 2

      # 2. Update Cache Links
      ln -sf "$IMG" "$HOME/.cache/current_wallpaper.jpg"
      ${pkgs.imagemagick}/bin/magick "$IMG" -resize ^640x1080 -gravity center -extent 640x1080 "$HOME/.cache/rofi-launcher.jpg" || true

      # 3. Run The Engine
      theme-engine "$IMG"

      # 4. Reload Applications
      systemctl --user start niri-config-assembler.service
      niri msg action load-config-file

      if pgrep -x kitty > /dev/null; then
          kitty @ --to=unix:@mykitty set-colors -a -c ~/.cache/wal/colors-kitty.conf || true
      fi

      notify-send "Theme Active" "$(basename "$IMG")" -i "$IMG"
    '')

    # ---------------------------------------------------
    # 5. WALL SELECT (The UI)
    # Rofi Menu to pick wallpapers
    # ---------------------------------------------------
    (pkgs.writeShellScriptBin "wall-select" ''
      THUMB_WIDTH=415
      THUMB_HEIGHT=550
      export PATH=${pkgs.imagemagick}/bin:${pkgs.coreutils}/bin:${pkgs.rofi}/bin:${pkgs.findutils}/bin:${pkgs.libnotify}/bin:$PATH
      export CACHE_DIR="${cacheDir}"
      mkdir -p "$CACHE_DIR"

      if [ ! -d "${wallDir}" ]; then
        notify-send "Error" "Wallpaper dir missing: ${wallDir}" -u critical
        exit 1
      fi

      # Generate Thumbs (Fast parallel processing)
      find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
      xargs -0 -P $(nproc) -I {} sh -c '
        img="{}"
        filename=$(basename "$img")
        cache="$CACHE_DIR/$filename"
        if [ ! -f "$cache" ]; then
          magick "$img" -thumbnail "415x550^" -gravity center -extent 415x550 "$cache" 2>/dev/null || true
        fi
      '

      # Rofi Menu
      SELECTED=$( \
        find -L "${wallDir}" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | \
        xargs -0 basename -a | \
        sort | \
        while IFS= read -r filename; do
            printf "%s\0icon\x1f%s/%s\n" "$filename" "$CACHE_DIR" "$filename"
        done | \
        ${pkgs.rofi}/bin/rofi -dmenu -theme "${rofiTheme}" -p "Select Wallpaper" -show-icons \
      )

      # Apply Selection
      if [ -n "$SELECTED" ]; then
        theme-manager "${wallDir}/$SELECTED"
      fi
    '')
  ];
}
