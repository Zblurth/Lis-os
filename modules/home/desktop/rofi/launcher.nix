{ pkgs, config, lib, ... }:
let
  rofiBg = "${config.home.homeDirectory}/.cache/rofi-launcher.jpg";
in
{
  home.packages = [
    (pkgs.writeShellScriptBin "launcher" ''
      #!${pkgs.bash}/bin/bash
      set -e

      # 1. Image Generation (Targeting 400x650 for compact layout)
      # If image is missing or wrong size (simple check), regenerate
      if [ ! -f "${rofiBg}" ]; then
        ${pkgs.imagemagick}/bin/convert "${config.stylix.image}" -resize ^400x650 -gravity center -extent 400x650 "${rofiBg}"
      fi

      # 2. Launch Rofi
      # We moved configuration into the .rasi file to keep this clean
      ${pkgs.rofi}/bin/rofi \
        -show drun \
        -theme "${config.home.homeDirectory}/.config/rofi/launcher.rasi" \
        -modes "drun,filebrowser,run" \
        -display-drun "🚀" \
        -display-run "🤖" \
        -display-filebrowser "📁"
    '')
  ];

  xdg.configFile."rofi/launcher.rasi".source = ./config/launcher.rasi;

  # Ensure the cache is updated on system rebuild
  home.activation.setupWallpaperCache = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    echo "Updating Rofi Sidebar..."
    ${pkgs.imagemagick}/bin/convert "${config.stylix.image}" -resize ^400x650 -gravity center -extent 400x650 "${rofiBg}"
  '';
}
