{ pkgs, config, lib, ... }:
let
  rofiBg = "${config.home.homeDirectory}/.cache/rofi-launcher.jpg";
in
{
  home.packages = [
    (pkgs.writeShellScriptBin "launcher" ''
      set -e

      if [ ! -f "${rofiBg}" ]; then
        ${pkgs.imagemagick}/bin/convert "${config.stylix.image}" -resize ^400x650 -gravity center -extent 400x650 "${rofiBg}"
      fi

      # Short labels to prevent "..." truncation
      ${pkgs.rofi}/bin/rofi \
        -show drun \
        -theme "${config.home.homeDirectory}/.config/rofi/launcher.rasi" \
        -modes "drun,windows:rofi-niri-kill,filebrowser" \
        -display-drun "🚀" \
        -display-windows "💀" \
        -display-filebrowser "📁" \
        -markup-rows \
        -kb-mode-next "Control+Tab" \
        -kb-mode-prev "Control+Shift+Tab" \
        "$@"
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
