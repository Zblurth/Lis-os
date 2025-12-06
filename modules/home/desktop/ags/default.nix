{ pkgs, inputs, ... }:
{
  # Install AGS v1 from the Flake Input
  home.packages = [
    inputs.ags.packages.${pkgs.system}.default
    pkgs.dart-sass
    pkgs.libdbusmenu-gtk3
    pkgs.gtksourceview
  ];

  # Link the config folder
  xdg.configFile."ags" = {
    source = ./config;
    recursive = true;
  };
}
