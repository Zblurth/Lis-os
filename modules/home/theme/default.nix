{ pkgs, ... }:
{
  imports = [ 
    ./scripts.nix 
  ];

  # Dependencies
  home.packages = with pkgs; [
    matugen
    swww
    imagemagick
    rofi
  ];

  # Link Configuration Files
  xdg.configFile = {
    "matugen/config.toml".source = ./matugen.toml;
    "matugen/templates/niri.kdl".source = ./templates/niri.kdl;
    "matugen/templates/rofi.rasi".source = ./templates/rofi.rasi;
    
    # Link the WallSelect theme we just created
    "rofi/WallSelect.rasi".source = ../desktop/rofi/config/WallSelect.rasi;
  };
}
