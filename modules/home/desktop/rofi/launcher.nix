{ pkgs, config, lib, ... }:
let
  rofiBg = "${config.home.homeDirectory}/.cache/rofi-launcher.jpg";
in
{
  home.packages = [
    (pkgs.writeShellScriptBin "launcher" ''
      #!${pkgs.bash}/bin/bash
      set -e

      # Ensure wallpaper exists
      if [ ! -f "${rofiBg}" ]; then
        ${pkgs.imagemagick}/bin/convert "${config.stylix.image}" -resize ^400x650 -gravity center -extent 400x650 "${rofiBg}"
      fi

      # Default to 'drun' (Apps), but allow overriding via $1
      MODE="${"\$1"}"
      if [ -z "$MODE" ]; then MODE="drun"; fi

      # Launch Rofi
      ${pkgs.rofi}/bin/rofi \
        -show "$MODE" \
        -theme "${config.home.homeDirectory}/.config/rofi/launcher.rasi" \
        -modes "drun,windows:rofi-niri-kill,filebrowser" \
        -display-drun "Apps" \
        -display-windows "Kill" \
        -display-filebrowser "Files" \
        -markup-rows \
        -kb-mode-next "Control+Tab" \
        -kb-mode-prev "Control+Shift+Tab"
    '')
  ];

  xdg.configFile."rofi/launcher.rasi".source = ./config/launcher.rasi;

  home.activation.setupWallpaperCache = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    if [ ! -f "${rofiBg}" ]; then
      echo "Initializing Rofi Sidebar..."
      ${pkgs.imagemagick}/bin/convert "${config.stylix.image}" -resize ^400x650 -gravity center -extent 400x650 "${rofiBg}"
    fi
  '';
}
