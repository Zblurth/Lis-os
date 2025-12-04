{ pkgs, config, lib, ... }:
let
  # The specific background file for the launcher
  rofiBg = "${config.home.homeDirectory}/.cache/rofi-launcher.jpg";
in
{
  home.packages = [
    (pkgs.writeShellScriptBin "launcher" ''
      #!${pkgs.bash}/bin/bash
      set -e

      # Check if the specific sidebar background exists
      if [ ! -f "${rofiBg}" ]; then
        # Create it from the current stylix image
        ${pkgs.imagemagick}/bin/convert "${config.stylix.image}" -resize ^640x1080 -gravity center -extent 640x1080 "${rofiBg}"
      fi

      ${pkgs.rofi}/bin/rofi \
        -show drun \
        -theme "${config.home.homeDirectory}/.config/rofi/launcher.rasi" \
        -matching fuzzy \
        -sort \
        -sorting-method fzf \
        -markup-rows \
        -no-config \
        -scroll-method 0 \
        -kb-mode-next "Control+Tab" \
        -kb-mode-prev "Control+Shift+Tab" \
        -modes "drun,run,ssh" \
        -kb-accept-entry "Return" \
        -kb-row-down "Down" \
        -kb-row-up "Up" \
        -kb-accept-custom ""
    '')
  ];

  # Link the theme file
  xdg.configFile."rofi/launcher.rasi".source = ./config/launcher.rasi;

  # Ensure the cache is ready on activation
  home.activation.setupWallpaperCache = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    if [ ! -f "${rofiBg}" ]; then
      echo "Initializing Rofi sidebar..."
      ${pkgs.imagemagick}/bin/convert "${config.stylix.image}" -resize ^640x1080 -gravity center -extent 640x1080 "${rofiBg}"
    fi
  '';
}
