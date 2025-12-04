{ pkgs, config, ... }:
{
  # 1. Install Dependencies locally (Self-contained module)
  home.packages = with pkgs; [
    matugen
    swww
    imagemagick # For thumbnail generation
  ];

  # 2. Link the Matugen Config & Templates
  # We use xdg.configFile to map them to ~/.config/matugen
  xdg.configFile = {
    "matugen/config.toml".source = ./matugen.toml;
    
    # We will create these template files in the next steps
    "matugen/templates/niri.kdl".source = ./templates/niri.kdl;
    "matugen/templates/rofi.rasi".source = ./templates/rofi.rasi;
  };
}
